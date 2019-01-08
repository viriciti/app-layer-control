async                = require "async"
compression          = require "compression"
config               = require "config"
constantCase         = require "constant-case"
cookieParser         = require "cookie-parser"
cors                 = require "cors"
debug                = (require "debug") "app: main"
express              = require "express"
http                 = require "http"
path                 = require "path"
socketio             = require "socket.io"
{ Map, fromJS }      = require "immutable"
{ Observable }       = require "rxjs"
{ each, size, noop } = require "lodash"
mqtt                 = require "mqtt"
RPC                  = require "mqtt-json-rpc"
semver               = require "semver"

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
populateMqttWithGroups       = require "./helpers/populateMqttWithGroups"
populateMqttWithDeviceGroups = require "./helpers/populateMqttWithDeviceGroups"
getVersionsNotMatching       = require "./lib/getVersionsNotMatching"
getContainersNotRunning      = require "./lib/getContainersNotRunning"
runUpdates                   = require "./updates"
sendMessageToMqtt            = require "./updates/sendMessageToMqtt"
{ cacheUpdate }              = require "./observables"
apiRouter                    = require "./api"

log = (require "./lib/Logger") "main"

# Server initialization
app     = express()
server  = http.createServer app
io      = socketio server
sockets = {}
db      = new Database

rpc               = null
mqttClient        = null
legacy_sendToMqtt = null
store             = (require "./store") db
deviceStates      = Map()
getDeviceStates   = -> deviceStates

log.warn "Not publishing messages to MQTT: read only" if config.mqtt.readOnly

main = ->
	initMqtt()
	initSocketIO()

	store.ensureDefaultDeviceSources ->
		log.info "Saved default table columns"

	registry$ = DockerRegistry config.versioning, db
	registry$.subscribe(
		(images) ->
			debug "Getting images from registry..."

			store.setImages images, (error, result) ->
				return log.error error.message if error
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
	options =
		Object.assign(
			{},
			config.mqtt
			config.mqtt.connectionOptions
			clientId: config.mqtt.clientId
		)

	client            = mqttClient = mqtt.connect options
	client.publish    = noop if config.mqtt.readOnly
	legacy_sendToMqtt = sendMessageToMqtt mqttClient
	rpc               = new RPC client, timeout: config.mqtt.responseTimeout

	onConnect = ->
		log.info "Connected to MQTT Broker at #{options.host}:#{options.port}"

		async.parallel [
			(cb) -> populateMqttWithGroups db, mqttClient, cb
			(cb) -> populateMqttWithDeviceGroups db, mqttClient, cb
		], (error) ->
			return log.error if error

			async.parallel
				configurations:        store.getConfigurations
				registryImages:        store.getRegistryImages
				groups:                store.getGroups
			, (error, populate) ->
				return log.error if error

				store.cacheConfigurations        populate.configurations
				store.cacheRegistryImages        populate.registryImages
				store.cacheGroups                populate.groups

				log.info "Cache succesfully populated"

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
								keyPath      = [ clientId ].concat(mapTo)
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

						deviceUpdates         = deviceStates
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

				# After we have subscribed to all socket events. We subscribe to the mqtt topics.
				# We do this so we do not miss any data that might come through when we are not listening for events yet.
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
		log.info "Connection to the MQTT broker closed"

	client
		.on "connect", onConnect
		.on "error",   onError
		.on "close",   onClose

initSocketIO = ->
	log.info "Initializing socket.io"

	io.on "connection", (socket) ->
		log.info "Client connected: #{socket.id}"
		sockets[socket.id] = socket

		store.kick (error, state) ->
			return log.error error if error

			mapActionToValue =
				configurations:        state.get "configurations"
				groups:                state.get "groups"
				registryImages:        state.get "registryImages"
				devicesState:          state.get "devicesState", deviceStates
				deviceSources:         state.get "deviceSources"
				allowedImages:         state.get "allowedImages"

			each mapActionToValue, (data, type) ->
				socket.emit "action",
					type: constantCase type
					data: data.toJS()

		socket
			.on "action:device",     _onActionDevice
			.on "action:device:get", _onActionDeviceGet
			.on "action:devices",    _onActionDevices
			.on "action:db",         _onActionDb
			.once "disconnect", ->
				log.warn "Client #{socket.id} disconnected!"
				socket.removeListener "action:device",     _onActionDevice
				socket.removeListener "action:device:get", _onActionDeviceGet
				socket.removeListener "action:devices",    _onActionDevices
				socket.removeListener "action:db",         _onActionDb
				delete sockets[socket.id]

_broadcastAction = (type, data) ->
	each sockets, (socket) ->
		socket.emit "action",
			type: constantCase type
			data: data

_onActionDevice = (action, cb) ->
	messageTable    =
		refreshState: "State refreshed"
		storeGroups:  "Group(s) added"

	appVersion = deviceStates.getIn [action.dest, "systemInfo", "appVersion"]
	appVersion = deviceStates.getIn [action.dest, "systemInfo", "dmVersion"] unless appVersion

	message = messageTable[action.action]
	log.warn "No message configured for action '#{action.action}'" unless message?.trim?().length
	message or= "Done"

	# device-mqtt has been removed since 1.16.0
	if appVersion and semver.gt appVersion, "1.15.0"
		try
			await rpc.call "actions/#{action.dest}/#{action.action}", action.payload
			cb null, message
		catch error
			cb message: error.message
	else
		legacy_sendToMqtt action, (error) ->
			return cb message: error.message if error
			cb null, message

_onActionDevices = (action, cb) ->
	{ payload, dest } = action

	debug "Performing #{action.action} for #{dest?.length or 0} devices"

	async.map dest, (device, next) ->
		actionToSend = Object.assign {}, action, { payload, dest: device }
		legacy_sendToMqtt actionToSend, next
	, cb

_onActionDeviceGet = (action, cb) ->
	legacy_sendToMqtt action, cb

_onActionDb = ({ action, payload, meta }, cb) ->
	{ execute }  = (require "./actions") db, mqttClient, _broadcastAction, store
	messageTable =
		storeGroups:         "Groups updated for #{payload?.dest}"
		createConfiguration: "Application updated"
		removeConfiguration: "Application removed"
		createGroup:         "Group updated"
		removeGroup:         "Group removed"
		addRegistryImage:    "Registry image added"
		removeRegistryImage: "Registry image removed"

	execute { action, payload, meta }, (error, result) ->
		debug "Received an error: #{error.message}" if error
		return cb message: error.message if error

		debug "Received result for action: #{action} - #{result}"
		cb null, messageTable[action] or "Done"

# parcel
Bundler = require "parcel-bundler"
bundler = new Bundler path.resolve __dirname, "..", "client", "index.html"

bundler.once "bundled", (bundle) ->
	await db.connect()
	await runUpdates { db, store }

	main()

	server.listen process.env.PORT or config.server.port, ->
		log.info "Server listening on :#{@address().port}"

app.use cors()
app.use compression()
app.use cookieParser()
app.use "/api", apiRouter
app.use bundler.middleware()
