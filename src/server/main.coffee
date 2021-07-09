RPC                              = require "mqtt-json-rpc"
WebSocket                        = require "ws"
bodyParser                       = require "body-parser"
compression                      = require "compression"
config                           = require "config"
cors                             = require "cors"
dotize                           = require "dotize"
debug                            = (require "debug") "app:main"
express                          = require "express"
http                             = require "http"
kleur                            = require "kleur"
morgan                           = require "morgan"
mqtt                             = require "async-mqtt"
map                              = require "p-map"
{ Map, fromJS }                  = require "immutable"
{ Observable, Subject }          = require "rxjs"
{ isEmpty, negate, every, omit } = require "lodash"

{
	DevicesLogs
	DevicesNsState
	DevicesState
	DevicesStatus
	DeviceGroups
	DockerRegistry
}                              = require "./sources"
Database                       = require "./db/Database"
Store                          = require "./Store"
bundle                         = require "./bundle"
populateMqttWithDeviceGroups   = require "./helpers/populateMqttWithDeviceGroups"
populateMqttWithGroups         = require "./helpers/populateMqttWithGroups"
runUpdates                     = require "./updates"
Watcher                        = require "./db/Watcher"
Broadcaster                    = require "./Broadcaster"
{ installPlugins, runPlugins } = require "./plugins"
log                            = (require "./lib/Logger") "main"

# Server initialization
app     = express()
server  = http.createServer app
port    = process.env.PORT or config.server.port
ws      = new WebSocket.Server server: server
db      = new Database
store   = new Store db

rpc = null

log.info "NPM authentication enabled: #{if every config.server.npm then 'yes' else 'no'}"
log.info "Docker registry: #{config.versioning.registry.url}"
log.info "GitLab endpoint: #{config.versioning.registry.host}"

app.use cors()
app.use compression()
app.use bodyParser.json strict: true

unless process.env.NODE_ENV is "production"
	# HTTP request logger
	app.use morgan "dev",
		skip: (req) ->
			url   = req.baseUrl
			url or= req.originalUrl

			not url.startsWith "/api"

app.use "/api",         require "./api"
app.use "/api/devices", require "./api/devices"

# required to support await operations
do ->
	await bundle app
	await db.connect()
	await runUpdates db: db, store: store
	await installPlugins config.plugins

	await store.ensureDefaultDeviceSources()

	socket = mqtt.connect config.mqtt
	socket.setMaxListeners 15

	rpc            = new RPC socket, timeout: config.mqtt.responseTimeout
	broadcaster    = new Broadcaster ws
	watcher        = new Watcher
		db:          db
		store:       store
		mqtt:        socket
		broadcaster: broadcaster

	onConnect = ->
		log.info "Connected to MQTT Broker at #{config.mqtt.host}:#{config.mqtt.port}"

		log.info "mqtt: Populating ..."
		await populateMqttWithGroups db, socket
		await populateMqttWithDeviceGroups db, socket

		devicesLogs$    = DevicesLogs.observable    socket
		devicesNsState$ = DevicesNsState.observable socket
		devicesState$   = DevicesState.observable   socket
		devicesStatus$  = DevicesStatus.observable  socket
		deviceGroups$   = DeviceGroups.observable   socket
		registry$       = DockerRegistry            config.versioning, db
		source$         = new Subject

		# device logs
		devicesLogs$.subscribe (message) ->
			broadcaster.broadcast Broadcaster.LOGS, message

		# state updates
		devicesState$
			.mergeMap ({ deviceId, data }) ->
				filter          = deviceId: deviceId
				update          = omit data, ["groups", "status"]
				update.deviceId = deviceId

				debug "Updated state for device %s", deviceId

				Observable.from db.DeviceState.updateOne filter, update, upsert: true
			.bufferTime 5000
			.subscribe (updates) ->
				log.info "Updated #{updates.length} device(s)" if updates.length

		# specific state updates
		# these updates are broadcasted more frequently
		devicesNsState$
			.merge deviceGroups$
			.mergeMap ({ deviceId, key, value }) ->
				filter = deviceId: deviceId
				update =
					deviceId: deviceId
					[key]:    value

				Observable.from db.DeviceState.updateOne filter, update, upsert: true
			.bufferTime 5000
			.subscribe (updates) ->
				log.info "Updated namespaced state for #{updates.length} device(s)" if updates.length

		# status updates
		devicesStatus$
			.mergeMap ({ deviceId, status }) ->
				filter = deviceId: deviceId
				update =
					deviceId:  deviceId
					connected: status is "online"

				debug "Updated status for device %s", deviceId

				Observable.from db.DeviceState.updateOne filter, update, upsert: true
			.bufferTime 5000
			.subscribe (updates) ->
				log.info "Updated status for #{updates.length} device(s)" if updates.length

		# check for empty devicegroup
		devicesStatus$
			.mergeMap ({ deviceId, status }) ->
				deviceState = await db.DeviceState.findOne { deviceId }
				debug "[check for empty devicegroup] Got from DB: device %s, status %s, deviceState from db %o", deviceId, status, deviceState

				if deviceState
					debug "[check for empty devicegroup] device %s is in DB", deviceId
					if deviceState.groups?.length
						debug "[check for empty devicegroup] device %s is in DB and has groups %o", deviceId, deviceState.groups
						return
				else
					deviceState = new DeviceState
						deviceId:  deviceId
						connected: status is "online"
					debug "[check for empty devicegroup] device %s is NOT in DB: creating %o", deviceState.toJSON()

				debug "[check for empty devicegroup] Saving device %s", deviceId
				await deviceState.save()
				debug "[check for empty devicegroup] Saved device %s", deviceId

				deviceId

			.subscribe (deviceId) ->
				if deviceId
					log.info "Did not find groups for #{deviceId}, added default group"

		# docker registry
		registry$
			.mergeMap (images) ->
				Observable.from store.storeRegistryImages images
			.subscribe ->
				broadcaster.broadcastRegistry()

		# plugin sources
		source$
			.filter ({ _internal, deviceId, data }) ->
				return false if _internal

				return log.warn "No device ID found in state payload, ignoring update ..." unless deviceId?
				return log.warn "No data found in state payload, ignoring update ..."      unless data?
				true
			.mergeMap ({ deviceId, data }) ->
				data   = omit data, "deviceId"
				filter = deviceId: deviceId
				update = Object.assign deviceId: deviceId, dotize.convert external: data

				Observable.from db.DeviceState.updateOne filter, update, upsert: true
			.bufferTime 5000
			.subscribe (updates) ->
				log.info "Updated #{updates.length} device(s) from external sources" if updates.length

		[
			[Broadcaster.NS_STATE, devicesNsState$]
			[Broadcaster.STATE,    devicesState$]
			[Broadcaster.STATUS,   devicesStatus$]
		].forEach ([name, observable$]) ->
			observable$
				.map (data) ->
					name:      name
					data:      data
					_internal: true
				.subscribe source$

		# plugins
		runPlugins config.plugins, source$

		await socket.subscribe [
			DevicesState.topic
			DevicesLogs.topic
			DevicesNsState.topic
			DevicesStatus.topic
			DeviceGroups.topic
		]
		log.info "mqtt: Subscribed"

	onError = (error) ->
		log.error error.message

	onClose = (reason) ->
		log.warn "Connection to the MQTT broker closed: #{reason}"

	socket
		.on "connect", onConnect
		.on "error",   onError
		.on "close",   onClose

	# start watching on database changes
	watcher.watch()

	# provide tools for routes
	app.locals.rpc         = rpc
	app.locals.mqtt        = socket
	app.locals.db          = db
	app.locals.broadcaster = broadcaster

	server.listen port, ->
		log.info "Server listening on :#{@address().port}"

# catch unhandled rejections
process.on "unhandledRejection", (error) ->
	log.error "#{kleur.red "Unhandled rejection:"} #{error.message}"
	log.error error.stack

	process.exit 1
