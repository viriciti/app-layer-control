RPC                               = require "mqtt-json-rpc"
WebSocket                         = require "ws"
bodyParser                        = require "body-parser"
compression                       = require "compression"
config                            = require "config"
cors                              = require "cors"
express                           = require "express"
http                              = require "http"
morgan                            = require "morgan"
mqtt                              = require "async-mqtt"
{ Map }                           = require "immutable"
{ isEmpty, negate, every, keyBy } = require "lodash"
{ Observable, Subject }           = require "rxjs"
kleur                             = require "kleur"

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

rpc             = null
deviceStates    = Map()
getDeviceStates = -> deviceStates

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
app.use "/api/devices", (require "./api/devices") getDeviceStates

updateInBulk = (updates) ->
	bulkUpdate = updates.reduce (bulk, update) ->
		throw new Error "Invalid state: no deviceId found on update" unless update.get "deviceId"
		throw new Error "Invalid state: no data found on update"     unless update.get "data"

		operation =
			updateOne:
				filter: deviceId: update.get "deviceId"
				update: update.get("data", Map()).toJS()
				upsert: true

		[...bulk, operation]
	, []

	bulkUpdate.forEach (a) ->
		console.log a.updateOne.filter.deviceId

	{ upsertedCount, modifiedCount } = await db.Device.bulkWrite bulkUpdate
	{ upsertedCount, modifiedCount }

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
		db:    db
		store: store
		mqtt:  socket

	onConnect = ->
		log.info "Connected to MQTT Broker at #{config.mqtt.host}:#{config.mqtt.port}"

		# log.info "mqtt: Populating ..."
		# await populateMqttWithGroups db, socket
		# await populateMqttWithDeviceGroups db, socket

		devicesLogs$    = DevicesLogs.observable    socket
		devicesNsState$ = DevicesNsState.observable socket
		devicesState$   = DevicesState.observable   socket
		devicesStatus$  = DevicesStatus.observable  socket
		deviceGroups$   = DeviceGroups.observable   socket
		registry$       = DockerRegistry            config.versioning, db
		source$         = new Subject

		Observable
			.fromEvent db.Device.watch(fullDocument: "updateLookup"), "change"
			.map ({ fullDocument, updateDescription }) ->
				{ deviceId }      = fullDocument

				{ updatedFields } = updateDescription if updateDescription
				updatedFields   or= deviceId

				{ ...updatedFields, deviceId: deviceId }
			.bufferTime config.batchState.defaultInterval
			.subscribe (changes) ->
				broadcaster.broadcast Broadcaster.STATE, keyBy changes, "deviceId"

		# device logs
		devicesLogs$.subscribe (message) ->
			broadcaster.broadcast Broadcaster.LOGS, message

		devicesState$
			.bufferTime config.batchState.defaultInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				{ modifiedCount, upsertedCount } = await updateInBulk updates
				log.info "Updated #{modifiedCount} device(s) and added #{upsertedCount} (state)"

		devicesNsState$
			.bufferTime config.batchState.nsStateInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				{ modifiedCount, upsertedCount } = await updateInBulk updates
				log.info "Updated #{modifiedCount} device(s) and added #{upsertedCount} (namespaced state)"

		# first time online devices
		devicesStatus$
			.bufferTime config.batchState.nsStateInterval
			.filter negate isEmpty
			.flatMap (updates) ->
				store.ensureDefaultGroups updates.map (update) ->
					update.get "deviceId"
			.subscribe (updates) ->
				{ insertedCount } = updates
				return unless insertedCount

				log.info "Inserted default groups for #{insertedCount} device(s)"

		# docker registry
		registry$.subscribe (images) ->
			await store.storeRegistryImages images
			broadcaster.broadcastRegistry()

		# plugin sources
		source$
			.filter ({ _internal }) ->
				not _internal
			.bufferTime config.batchState.defaultInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				stateUpdates = updates
					.filter ({ deviceId, data }) ->
						return log.warn "No device ID found in state payload. Ignoring update ..." unless deviceId?
						return log.warn "No data found in state payload. Ignoring update ..."      unless data?
						true
					.reduce (devices, { deviceId, data }) ->
						devices.mergeIn [deviceId], data
					, Map()

				deviceStates = deviceStates.mergeDeep stateUpdates
				broadcaster.broadcast Broadcaster.STATE, stateUpdates

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

		log.info "mqtt: Subscribing ..."
		await socket.subscribe [
			DevicesState.topic
			DevicesLogs.topic
			DevicesNsState.topic
			DevicesStatus.topic
			DeviceGroups.topic
		]

	onError = (error) ->
		log.error error.message

	onClose = ->
		log.warn "Connection to the MQTT broker closed"

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
