WebSocket             = require "ws"
bodyParser            = require "body-parser"
compression           = require "compression"
config                = require "config"
constantCase          = require "constant-case"
cors                  = require "cors"
debug                 = (require "debug") "app:main"
express               = require "express"
http                  = require "http"
morgan                = require "morgan"
mqtt                  = require "async-mqtt"
{ Map, List, fromJS } = require "immutable"
{ Observable }        = require "rxjs"
{ each, size, noop }  = require "lodash"

{
	DevicesLogs
	DevicesNsState
	DevicesState
	DevicesStatus
	DeviceGroups
	DockerRegistry
	externals
}                            = require "./sources"
Database                     = require "./db"
Store                        = require "./Store"
Watcher                      = require "./db/Watcher"
bundle                       = require "./bundle"
getContainersNotRunning      = require "./lib/getContainersNotRunning"
getVersionsNotMatching       = require "./lib/getVersionsNotMatching"
populateMqttWithDeviceGroups = require "./helpers/populateMqttWithDeviceGroups"
populateMqttWithGroups       = require "./helpers/populateMqttWithGroups"
runUpdates                   = require "./updates"
{ cacheUpdate }              = require "./observables"

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
legacy_sendToMqtt = null
deviceStates      = Map()
getDeviceStates   = -> deviceStates

log.warn "Not publishing messages to MQTT: read only" if config.mqtt.readOnly

main = ->
	initMqtt()

	await store.ensureDefaultDeviceSources()

	registry$ = DockerRegistry config.versioning, db
	registry$.subscribe(
		(images) ->
			debug "Getting images from registry..."

			await store.storeRegistryImages images

			log.info "Images have been updated!"
			_broadcastAction "registryImages", images

		(error) -> log.error "Error in Docker Registry: #{error.message}"
	)

convertDeviceGroupsToArrayMap = (deviceGroups = []) ->
	deviceGroups.reduce (memo, groupName, index) ->
		memo[index + 1] = groupName
		memo
	, {}

versionsMismatchToString = (mismatch) ->
	mismatch
		.map (version, name) ->
			actual   = version.get "actual"
			expected = version.get "expected"

			"Expected #{name} to run #{expected}, currently running: #{actual or "not installed"}"
		.valueSeq()
		.join "\n"

containersNotRunningToString = (containers) ->
	containers
		.map (container, name) ->
			"#{name} is not running"
		.join "\n"

initMqtt = ->
	options           = { ...config.mqtt.connectionOptions, ...config.mqtt }
	client            = mqttClient  = mqtt.connect options
	client.publish    = noop if config.mqtt.readOnly
	# legacy_sendToMqtt = sendMessageToMqtt mqttClient
	# rpc               = new RPC client._client, timeout: config.mqtt.responseTimeout

	onConnect = ->
		log.info "Connected to MQTT Broker at #{options.host}:#{options.port}"

		await populateMqttWithGroups db, mqttClient
		await populateMqttWithDeviceGroups db, mqttClient

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

		devicesLogs$    = DevicesLogs.observable    mqttClient
		devicesNsState$ = DevicesNsState.observable mqttClient
		devicesState$   = DevicesState.observable   mqttClient
		devicesStatus$  = DevicesStatus.observable  mqttClient
		deviceGroups$   = DeviceGroups.observable   mqttClient
		cacheUpdate$    = cacheUpdate               store

		each externals, (source) ->
			{
				observable
				mapFrom
				mapTo
				foreignKey
			} = source getDeviceStates

			observable
				.takeUntil Observable.fromEvent mqttClient, "disconnected"
				.bufferTime config.batchState.defaultInterval
				.subscribe (externalOutputs) ->
					return unless externalOutputs.length

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

					_broadcastAction "devicesBatchState", deviceStates

		cacheUpdate$
			.takeUntil Observable.fromEvent mqttClient, "disconnected"
			.subscribe ->
				log.info "Cache has been updated... Validating outdated software for devices"

				deviceUpdates = deviceStates
					.reduce (updates, device) ->
						versionsNotMatching = getVersionsNotMatching
							store:             store
							deviceGroups:      convertDeviceGroupsToArrayMap device.get "groups"
							currentContainers: device.get "containers"

						deviceId        = device.get "deviceId"
						versionMismatch = versionsMismatchToString versionsNotMatching
						device          = device.setIn ["activeAlerts", "versionsNotMatching"], versionMismatch
						deviceStates    = deviceStates.mergeIn [deviceId], device

						updates[deviceId] = device
						updates
					, {}

				_broadcastAction "devicesBatchState", deviceUpdates

		devicesState$
			.bufferTime config.batchState.defaultInterval
			.subscribe (stateUpdates) ->
				return unless stateUpdates.length

				newStates = stateUpdates.map (stateUpdate) ->
					debug "Getting state for device #{stateUpdate.get "deviceId"}"

					clientId          = stateUpdate.get "deviceId"
					currentContainers = stateUpdate.get "containers"
					groups            = stateUpdate.get "groups"

					deviceGroups          = convertDeviceGroupsToArrayMap groups
					containersNotRunning  = getContainersNotRunning       currentContainers
					versionsNotMatching   = getVersionsNotMatching
						store:             store
						deviceGroups:      deviceGroups
						currentContainers: currentContainers

					extraState = fromJS
						deviceId:          clientId
						lastSeenTimestamp: Date.now()
						activeAlerts:
							versionsNotMatching:  versionsMismatchToString versionsNotMatching
							containersNotRunning: containersNotRunningToString containersNotRunning

					newState     = stateUpdate.merge extraState
					deviceStates = deviceStates.mergeIn [ clientId ], newState

					newState
				.reduce (devices, deviceState) ->
					devices[deviceState.get "deviceId"] = deviceState
					devices
				, {}

				debug "Sending #{size newStates} state updates"

				_broadcastAction "devicesBatchState", newStates

		devicesNsState$
			.merge deviceGroups$
			.bufferTime config.batchState.nsStateInterval
			.subscribe (nsStateUpdates) ->
				return unless nsStateUpdates.length

				newNsStates = nsStateUpdates.reduce (updates, nsStateUpdate) ->
					{ deviceId, key, value } = nsStateUpdate
					debug "devicesNsState is updating #{deviceId}"

					newState = fromJS
						deviceId:          deviceId
						"#{key}":          value
						lastSeenTimestamp: Date.now()

					deviceStates      = deviceStates.mergeIn [ deviceId ], newState
					updates[deviceId] = newState
					updates
				, {}

				debug "Sending #{size newNsStates} namespace state updates"

				_broadcastAction "devicesBatchState", newNsStates

		devicesStatus$
			.bufferTime config.batchState.defaultInterval
			.subscribe (statusUpdates) ->
				return unless statusUpdates.length

				newStatuses = statusUpdates.reduce (updates, statusUpdate) ->
					{ deviceId, status } = statusUpdate
					newState             = fromJS
						deviceId:     deviceId
						onlineStatus: status

					deviceStates      = deviceStates.mergeIn [ deviceId ], newState
					updates[deviceId] = onlineStatus: status
					updates
				, {}

				debug "Sending #{size newStatuses} status updates"

				_broadcastAction "devicesBatchState", newStatuses

		devicesLogs$.subscribe (logs) ->
			_broadcastAction "deviceLogs", logs

		# Publish default groups for first time devices
		devicesStatus$
			.filter ({ deviceId, retained }) ->
				not retained and deviceStates
					.getIn [deviceId, "groups"], List()
					.isEmpty()
			.subscribe ({ deviceId }) ->
				log.warn "No groups found for #{deviceId}, setting default groups ..."

				topic   = "devices/#{deviceId}/groups"
				message = JSON.stringify ["default"]
				options = retain: true

				client.publish topic, message, options

		client.subscribe [
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

	client
		.on "connect", onConnect
		.on "error",   onError
		.on "close",   onClose

_broadcastAction = (type, data) ->
	ws.clients.forEach (socket) ->
		socket.send JSON.stringify
			action: constantCase type
			data:   data

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

do ->
	await bundle app
	await db.connect()
	await runUpdates db: db, store: store

	main()

	broadcast = (type, data) ->
		debug "Broadcasting '#{type}' to #{size ws.clients} client(s)"

		ws.clients.forEach (client) ->
			client.send JSON.stringify
				action: constantCase type
				data:   data.toJS()

	broadcastApplications = ->
		broadcast "configurations", await store.getConfigurations()

	broadcastRegistry = ->
		broadcast "allowedImages",  await store.getAllowedImages()
		broadcast "registryImages", await store.getRegistryImages()

	broadcastGroups = ->
		broadcast "groups", await store.getGroups()

	broadcastSources = ->
		broadcast "deviceSources", await store.getDeviceSources()

	app.locals.mqtt = mqttClient
	app.locals.db   = db
	app.locals.broadcastApplications = broadcastApplications
	app.locals.broadcastRegistry     = broadcastRegistry
	app.locals.broadcastGroups       = broadcastGroups
	app.locals.broadcastSources      = broadcastSources

	db
		.DeviceGroup
		.watch [], fullDocument: "updateLookup"
		.on "change", ({ fullDocument }) ->
			{ deviceId, groups } = fullDocument

			topic   = "devices/#{deviceId}/groups"
			groups  = JSON.stringify groups
			options = retain: true

			mqttClient.publish topic, groups, options

	server.listen port, ->
		log.info "Server listening on :#{@address().port}"
