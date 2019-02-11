RPC                           = require "mqtt-json-rpc"
WebSocket                     = require "ws"
bodyParser                    = require "body-parser"
compression                   = require "compression"
config                        = require "config"
cors                          = require "cors"
debug                         = (require "debug") "app:main"
express                       = require "express"
http                          = require "http"
morgan                        = require "morgan"
mqtt                          = require "async-mqtt"
{ Map, List, fromJS }         = require "immutable"
{ Observable }                = require "rxjs"
{ each, size, noop, isEqual, isEmpty, groupBy, negate } = require "lodash"

{
	DevicesLogs
	DevicesNsState
	DevicesState
	DevicesStatus
	DeviceGroups
	DockerRegistry
	externals
}                            = require "./sources"
Database                     = require "./db/Database"
Store                        = require "./Store"
bundle                       = require "./bundle"
getContainersNotRunning      = require "./lib/getContainersNotRunning"
getVersionsNotMatching       = require "./lib/getVersionsNotMatching"
populateMqttWithDeviceGroups = require "./helpers/populateMqttWithDeviceGroups"
populateMqttWithGroups       = require "./helpers/populateMqttWithGroups"
runUpdates                   = require "./updates"
{ cacheUpdate }              = require "./observables"
Watcher                      = require "./db/Watcher"
Broadcaster                  = require "./Broadcaster"

versionsMismatchToString     = require "./utils/versionsMismatchToString"
containersNotRunningToString = require "./utils/containersNotRunningToString"

log = (require "./lib/Logger") "main"

# Server initialization
app     = express()
server  = http.createServer app
port    = process.env.PORT or config.server.port
ws      = new WebSocket.Server server: server
db      = new Database
store   = new Store db

rpc               = null
mqttClient        = null
deviceStates      = Map()
getDeviceStates   = -> deviceStates

log.warn "Not publishing messages to MQTT: read only" if config.mqtt.readOnly

main = ->
	initMqtt()

	await store.ensureDefaultDeviceSources()

	# registry$ = DockerRegistry config.versioning, db
	# registry$.subscribe(
	# 	(images) ->
	# 		debug "Getting images from registry..."

	# 		await store.storeRegistryImages images

	# 		log.info "Images have been updated!"
	# 		_broadcastAction "registryImages", images

	# 	(error) -> log.error "Error in Docker Registry: #{error.message}"
	# )

# initMqtt = ->
# 	options        = { ...config.mqtt.connectionOptions, ...config.mqtt }
# 	client         = mqttClient  = mqtt.connect options
# 	client.publish = noop if config.mqtt.readOnly
# 	rpc            = new RPC client._client, timeout: config.mqtt.responseTimeout
# 	watcher        = new Watcher
# 		db:    db
# 		store: store
# 		mqtt:  client

# 	watcher.watch()

# 	onConnect = ->
# 		log.info "Connected to MQTT Broker at #{options.host}:#{options.port}"

# 		await populateMqttWithGroups db, mqttClient
# 		await populateMqttWithDeviceGroups db, mqttClient

# 		[
# 			configurations
# 			registryImages
# 			groups
# 		] = await Promise.all [
# 			store.getConfigurations()
# 			store.getRegistryImages()
# 			store.getGroups()
# 		]

# 		store.set "configurations", configurations
# 		store.set "registry",       registryImages
# 		store.set "groups",         groups

# 		log.info "Cache succesfully populated with configurations, registry images and groups"

# 		devicesLogs$    = DevicesLogs.observable    mqttClient
# 		devicesNsState$ = DevicesNsState.observable mqttClient
# 		devicesState$   = DevicesState.observable   mqttClient
# 		devicesStatus$  = DevicesStatus.observable  mqttClient
# 		deviceGroups$   = DeviceGroups.observable   mqttClient
# 		cacheUpdate$    = cacheUpdate               store

# 		# each externals, (source) ->
# 		# 	{
# 		# 		observable
# 		# 		mapFrom
# 		# 		mapTo
# 		# 		foreignKey
# 		# 	} = source getDeviceStates

# 		# 	observable
# 		# 		.takeUntil Observable.fromEvent mqttClient, "disconnected"
# 		# 		.bufferTime config.batchState.defaultInterval
# 		# 		.subscribe (externalOutputs) ->
# 		# 			return unless externalOutputs.length

# 		# 			updatesToSend = externalOutputs.reduce (updates, externalOutput) ->
# 		# 				data         = fromJS externalOutput
# 		# 				value        = data.getIn mapFrom
# 		# 				clientId     = data.getIn foreignKey
# 		# 				keyPath      = [clientId].concat(mapTo)
# 		# 				deviceStates = deviceStates.setIn keyPath, value

# 		# 				# getIn makes it harder to determine the updates
# 		# 				# For now, just send the whole state and let Redux
# 		# 				# on the client side determine the difference
# 		# 				updates[clientId] = deviceStates.get clientId
# 		# 				updates
# 		# 			, {}

# 		# 			debug "Sending #{size updatesToSend} state updates after external source updates"

# 		# 			_broadcastAction "devicesBatchState", deviceStates

# 		# cacheUpdate$
# 		# 	.takeUntil Observable.fromEvent mqttClient, "disconnected"
# 		# 	.subscribe ->
# 		# 		log.info "Cache has been updated... Validating outdated software for devices"

# 		# 		deviceUpdates = deviceStates
# 		# 			.reduce (updates, device) ->
# 		# 				versionsNotMatching = getVersionsNotMatching
# 		# 					store:             store
# 		# 					deviceGroups:      convertDeviceGroupsToArrayMap device.get "groups"
# 		# 					currentContainers: device.get "containers"

# 		# 				deviceId        = device.get "deviceId"
# 		# 				versionMismatch = versionsMismatchToString versionsNotMatching
# 		# 				device          = device.setIn ["activeAlerts", "versionsNotMatching"], versionMismatch
# 		# 				deviceStates    = deviceStates.mergeIn [deviceId], device

# 		# 				updates[deviceId] = device
# 		# 				updates
# 		# 			, {}

# 		# 		_broadcastAction "devicesBatchState", deviceUpdates

# 		devicesState$
# 			.bufferTime config.batchState.defaultInterval
# 			.filter negate isEmpty
# 			.subscribe (updates) ->
# 				deviceStates = updates.reduce (devices, update) ->
# 					console.log "devices:", devices.size
# 					deviceId = update.get "deviceId"
# 					newState = update.merge Map
# 						lastSeenTimestamp: Date.now()

# 					devices.mergeIn [deviceId], newState
# 				, deviceStates

# 				broadcast

# 		# devicesState$
# 			# .bufferTime config.batchState.defaultInterval
# 			# .subscribe (stateUpdates) ->
# 			# 	return unless stateUpdates.length

# 			# 	newStates = stateUpdates.map (stateUpdate) ->
# 			# 		debug "Getting state for device #{stateUpdate.get "deviceId"}"

# 			# 		clientId          = stateUpdate.get "deviceId"
# 			# 		currentContainers = stateUpdate.get "containers"
# 			# 		groups            = stateUpdate.get "groups"

# 			# 		deviceGroups          = convertDeviceGroupsToArrayMap groups
# 			# 		containersNotRunning  = getContainersNotRunning       currentContainersdeviceGroups
# 			# 		versionsNotMatching   = getVersionsNotMatching
# 			# 			store:             store
# 			# 			deviceGroups:      deviceGroups
# 			# 			currentContainers: currentContainers

# 			# 		extraState = fromJS
# 			# 			deviceId:          clientId
# 			# 			lastSeenTimestamp: Date.now()
# 			# 			activeAlerts:
# 			# 				versionsNotMatching:  versionsMismatchToString versionsNotMatching
# 			# 				containersNotRunning: containersNotRunningToString containersNotRunning

# 			# 		newState     = stateUpdate.merge extraState
# 			# 		deviceStates = deviceStates.mergeIn [ clientId ], newState

# 			# 		newState
# 			# 	.reduce (devices, deviceState) ->
# 			# 		devices[deviceState.get "deviceId"] = deviceState
# 			# 		devices
# 			# 	, {}

# 			# 	debug "Sending #{size newStates} state updates"

# 			# 	_broadcastAction "devicesBatchState", newStates

# 		# devicesNsState$
# 		# 	.merge deviceGroups$
# 		# 	.bufferTime config.batchState.nsStateInterval
# 		# 	.subscribe (nsStateUpdates) ->
# 		# 		return unless nsStateUpdates.length

# 		# 		newNsStates = nsStateUpdates.reduce (updates, nsStateUpdate) ->
# 		# 			{ deviceId, key, value } = nsStateUpdate
# 		# 			debug "devicesNsState is updating #{deviceId}"

# 		# 			newState = fromJS
# 		# 				deviceId:          deviceId
# 		# 				"#{key}":          value
# 		# 				lastSeenTimestamp: Date.now()

# 		# 			deviceStates      = deviceStates.mergeIn [ deviceId ], newState
# 		# 			updates[deviceId] = newState
# 		# 			updates
# 		# 		, {}

# 		# 		debug "Sending #{size newNsStates} namespace state updates"

# 		# 		_broadcastAction "devicesBatchState", newNsStates

# 		# devicesStatus$
# 		# 	.bufferTime config.batchState.defaultInterval
# 		# 	.subscribe (statusUpdates) ->
# 		# 		return unless statusUpdates.length

# 		# 		newStatuses = statusUpdates.reduce (updates, statusUpdate) ->
# 		# 			{ deviceId, status } = statusUpdate
# 		# 			newState             = fromJS
# 		# 				deviceId:     deviceId
# 		# 				onlineStatus: status

# 		# 			deviceStates      = deviceStates.mergeIn [ deviceId ], newState
# 		# 			updates[deviceId] = onlineStatus: status
# 		# 			updates
# 		# 		, {}

# 		# 		debug "Sending #{size newStatuses} status updates"

# 		# 		_broadcastAction "devicesBatchState", newStatuses

# 		# devicesLogs$.subscribe (logs) ->
# 		# 	_broadcastAction "deviceLogs", logs

# 		# Publish default groups for first time devices
# 		# devicesStatus$
# 		# 	.filter ({ deviceId, retained }) ->
# 		# 		not retained and deviceStates
# 		# 			.getIn [deviceId, "groups"], List()
# 		# 			.isEmpty()
# 		# 	.subscribe ({ deviceId }) ->
# 		# 		log.warn "No groups found for #{deviceId}, setting default groups ..."

# 		# 		topic   = "devices/#{deviceId}/groups"
# 		# 		message = JSON.stringify ["default"]
# 		# 		options = retain: true

# 		# 		client.publish topic, message, options

# 		client.subscribe [
# 			DevicesState.topic
# 			DevicesLogs.topic
# 			DevicesNsState.topic
# 			DevicesStatus.topic
# 			DeviceGroups.topic
# 		], (error, granted) ->
# 			throw new Error "Error subscribing topics: #{error.message}" if error

# 			log.info "Subscribed to MQTT"
# 			log.info "Topics: #{granted.map(({ topic }) -> topic).join ", "}"

# 	onError = (error) ->
# 		log.error error.message

# 	onClose = ->
# 		log.warn "Connection to the MQTT broker closed"

# 	client
# 		.on "connect", onConnect
# 		.on "error",   onError
# 		.on "close",   onClose

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

# required to support await operations
do ->
	await bundle app
	await db.connect()
	await runUpdates db: db, store: store

	socket         = mqtt.connect config.mqtt
	rpc            = new RPC socket, timeout: config.mqtt.responseTimeout
	broadcaster    = new Broadcaster ws
	watcher        = new Watcher
		db:    db
		store: store
		mqtt:  socket

	onConnect = ->
		log.info "Connected to MQTT Broker at #{config.mqtt.host}:#{config.mqtt.port}"

		await populateMqttWithGroups db, socket
		await populateMqttWithDeviceGroups db, socket

		[
			configurations
			registryImages
			groups
		] = await Promise.all [
			store.getConfigurations()
			store.getRegistryImages()
			store.getGroups()
		]

		store.set "configurations", configurations
		store.set "registry",       registryImages
		store.set "groups",         groups

		log.info "Cache succesfully populated with configurations, registry images and groups"

		# devicesLogs$    = DevicesLogs.observable    mqttClient
		devicesNsState$ = DevicesNsState.observable socket
		devicesState$   = DevicesState.observable   socket
		devicesStatus$  = DevicesStatus.observable  socket
		# deviceGroups$   = DeviceGroups.observable   mqttClient
		# cacheUpdate$    = cacheUpdate               store

		# state updates
		devicesState$
			.bufferTime config.batchState.defaultInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				deviceStates = updates.reduce (devices, update) ->
					deviceId = update.get "deviceId"
					newState = update.merge Map
						lastSeenTimestamp: Date.now()

					devices.mergeIn [deviceId], newState
				, deviceStates

				broadcaster.broadcast "devicesBatchState", deviceStates

		# specific state updates
		# these updates are broadcasted more frequently
		devicesNsState$
			.bufferTime config.batchState.nsStateInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				deviceStates = updates.reduce (devices, update) ->
					key      = update.get "key"
					deviceId = update.get "deviceId"
					newState = update.merge Map
						"#{key}":          update.get "value"
						lastSeenTimestamp: Date.now()

					devices.mergeIn [deviceId], newState
				, deviceStates

				broadcaster.broadcast "devicesBatchState", deviceStates

		# status updates
		devicesStatus$
			.bufferTime config.batchState.defaultInterval
			.filter negate isEmpty
			.subscribe (updates) ->
				deviceStates = updates.reduce (devices, update) ->
					deviceId  = update.get "deviceId"
					newStatus = update.merge Map
						connected: update.status is "online"

					devices.mergeIn [deviceId], newStatus
				, deviceStates

				broadcaster.broadcast "devicesBatchState", deviceStates

		# external sources
		# ? API could be made simpler. For now, the source remains untouched
		each externals, (source) ->
			{
				observable
				mapFrom
				mapTo
				foreignKey
			} = source getDeviceStates

			observable
				.bufferTime config.batchState.defaultInterval
				.filter negate isEmpty
				.subscribe (externalOutputs) ->
					updatesToSend = externalOutputs.reduce (updates, externalOutput) ->
						data         = fromJS externalOutput
						value        = data.getIn mapFrom
						clientId     = data.getIn foreignKey
						keyPath      = [clientId].concat(mapTo)
						deviceStates = deviceStates.setIn keyPath, value

						# getIn makes it harder to determine the updates
						# For now, just send the whole state and let Redux
						# on the client side determine the difference
						updates[clientId] = deviceStates.get clientId
						updates
					, {}

					debug "Sending #{size updatesToSend} state updates after external source updates"

					broadcaster.broadcast "devicesBatchState", deviceStates

		socket.subscribe [
			DevicesState.topic
			DevicesLogs.topic
			DevicesNsState.topic
			DevicesStatus.topic
			DeviceGroups.topic
		], (error, granted) ->
			throw new Error "Error subscribing topics: #{error.message}" if error

			log.info "Subscribed to MQTT"
			log.info "Topics: #{granted.map(({ topic }) -> topic).join ", "}"

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

# inspect state of a device through CLI
process
	.stdin
	.on "data", (data) ->
		return if process.env.NODE_ENV is "production"

		input = data.toString().trim()
		return unless input.startsWith ".inspect"

		deviceId = input
			.split " "
			.slice 1
			.join ""
		return console.warn "device '#{deviceId}' not found" unless deviceStates.get deviceId

		file  = require("path").join ".local", deviceId
		state = deviceStates
			.get deviceId
			.toJS()

		require("fs").writeFileSync file, JSON.stringify state, null, 4
		console.log "state stored in #{file}"
