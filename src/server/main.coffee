async           = require "async"
compress        = require "compression"
config          = require "config"
constantCase    = require "constant-case"
cookieParser    = require "cookie-parser"
cors            = require "cors"
debug           = (require "debug") "app:main"
devicemqtt      = require "device-mqtt"
express         = require "express"
http            = require "http"
path            = require "path"
socketio        = require "socket.io"
{ Map, fromJS } = require "immutable"
{ Observable }  = require "rxjs"
{ each, size }  = require "underscore"

{
	DevicesLogs
	DevicesNsState
	DevicesState
	DevicesStatus
	DockerRegistry
	externals
}                       = require "./sources"
populateMqttWithGroups  = require "./helpers/populateMqttWithGroups"
getVersionsNotMatching  = require "./lib/getVersionsNotMatching"
getContainersNotRunning = require "./lib/getContainersNotRunning"
runUpdates              = require "./updates"
{ cacheUpdate }         = require "./observables"

log = (require "./lib/Logger") "Main"
db  = (require "./db") config.db

# Server initialization
app     = express()
server  = http.createServer app
io      = socketio server
sockets = {}

# Apply gzip compression and cors
app.use cors()
app.use compress()
app.use cookieParser()

mqttSocket      = null
store           = (require "./store") db
deviceStates    = Map()
getDeviceStates = -> deviceStates

main = ->
	initMqtt()
	initSocketIO()

	# HACK Wait for a while when populating local store with mqtt data. Currently all data is being proxied through
	# immediately causing massive load on connected clients
	# setTimeout initSocketIO, config.deferSocketConnectsAtStart

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
	connOpts =
		Object.assign(
			{},
			config.devicemqtt,
			config.devicemqtt.connectionOptions,
			clientId: config.devicemqtt.clientId
		)

	mqttServer = devicemqtt connOpts

	_onMqttConnected = (socket) ->
		mqttSocket = socket

		if config.readOnly
			log.warn "Running in read only mode"

			mqttSocket.customPublish = (opts, cb) ->
				log.warn "Read only mode! Not publishing to '#{opts.topic}'"
				cb?()

			mqttSocket.send = (opts, cb) ->
				log.warn "Read only mode! Not sending action"
				cb?()

		log.info "Connected to MQTT Broker at #{connOpts.host}:#{connOpts.port}"

		_onSocketError = (error) -> log.error "mqtt socket error: #{error.message}"

		mqttSocket
			.on   "error", _onSocketError
			.once "disconnected", ->
				mqttSocket.removeListener "error", _onSocketError

		populateMqttWithGroups db, mqttSocket, (error) ->
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

				devicesLogs$    = DevicesLogs.observable    mqttSocket
				devicesNsState$ = DevicesNsState.observable mqttSocket
				devicesState$   = DevicesState.observable   mqttSocket
				devicesStatus$  = DevicesStatus.observable  mqttSocket
				cacheUpdate$    = cacheUpdate               store

				each externals, (source) ->
					{
						observable
						mapFrom
						mapTo
						foreignKey
					} = source getDeviceStates

					observable
						.takeUntil Observable.fromEvent mqttSocket, "disconnected"
						.bufferTime config.batchStateInterval
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
					.takeUntil Observable.fromEvent mqttSocket, "disconnected"
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
					.bufferTime config.batchStateInterval
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

				# Triggers on every nsState topic event
				# The nsState topic contains split state top level key
				# It looks like this /devices/<serial>/nsState/<top-level-key>
				# It will contain an object of a part of some device' state
				devicesNsState$
					.bufferTime config.batchStateInterval
					.subscribe (nsStateUpdates) ->
						return unless nsStateUpdates.length

						newNsStates = nsStateUpdates.reduce (updates, nsStateUpdate) ->
							{ deviceId, key, val } = nsStateUpdate
							debug "devicesNsState is updating #{deviceId}"

							newState = fromJS
								deviceId:          deviceId
								"#{key}":          val
								lastSeenTimestamp: Date.now()

							deviceStates      = deviceStates.mergeIn [ deviceId ], newState
							updates[deviceId] = newState
							updates
						, {}

						debug "Sending #{size newNsStates} namespace state updates"

						_broadcastAction "devicesBatchState", newNsStates

				devicesStatus$
					.bufferTime config.batchStateInterval
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
				async.eachSeries [
					DevicesState.topic
					DevicesLogs.topic
					DevicesNsState.topic
					DevicesStatus.topic
				], (topic, cb) ->
					mqttSocket.customSubscribe
						topic: topic
						qos:   0
					, cb
				, (error) ->
					throw new Error "Error subscribing topics: #{error.message}" if error
					log.info "Subscribed to MQTT topics"

	mqttServer
		.on "connected", _onMqttConnected
		.on "disconnected", ->
			log.warn "Disconnected from MQTT Broker."
		.on "error", (error) ->
			log.error "An error occured #{error.message}"

	mqttServer.connect()

initSocketIO = ->
	log.info "Initializing socket.io"
	io.on "connection", (socket) ->
		log.info "Client connected: #{socket.id}"
		sockets[socket.id] = socket

		store.kick (error, state) ->
			return log.error error if error

			state = state.set "devicesState", deviceStates

			mapActionToValue =
				configurations:        state.get "configurations"
				groups:                state.get "groups"
				registryImages:        state.get "registryImages"
				devicesState:          state.get "devicesState"
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
	responseTimeout = -1

	resultCb = (error, result) ->
		log.error "Error in mqttSocket.send result", error if error
		clearTimeout responseTimeout
		cb error?.message, result

	timeoutCb = (error, ack) ->
		setTimeout ->
			if error
				log.error "Error publishing on mqtt", error
				return cb "Error publishing on mqtt" # NOTE typeof error is string as cb is a sio callback
			cb null, timeout: "Response took a while but action is published on mqtt"
		, config.responseTimeout

	mqttSocket.send action, resultCb, timeoutCb

_onActionDevices = (action, cb) ->
	{ payload, dest } = action

	debug "Performing #{action.action} for #{dest?.length or 0} devices"

	async.map dest, (device, next) ->
		actionToSend = Object.assign {}, action, { payload, dest: device }
		mqttSocket.send actionToSend, next, (error, ack) ->
			return log.error error.message if error
	, cb

_onActionDeviceGet = (action, resultCb) ->
	mqttSocket.send action, resultCb, (error, ack) ->
		return log.error error.message if error
		debug "Action #{action.action} sent correctly"

_onActionDb = ({ action, payload, meta }, resultCb) ->
	{ execute } = (require "./actions") db, mqttSocket, _broadcastAction, store

	execute { action, payload, meta }, (error, result) ->
		debug "Received an error: #{error.message}" if error
		return resultCb error if error

		debug "Received result for action: #{action} - #{result}"
		resultCb null, result

# Webpack section
if process.env.NODE_ENV not in ["production", "local-production"]
	webpackHotMiddleware = require "webpack-hot-middleware"
	webpackMiddleware    = require "webpack-dev-middleware"
	webpackConfig        = require "../../webpack.config.js"
	webpack              = require "webpack"

	compiler = webpack webpackConfig

	# Middlewares for webpack
	debug "Enabling webpack dev and HMR middlewares..."
	app.use(webpackMiddleware compiler,
		hot: true
		stats:
			colors: true
			chunks: false
			chunksModules: false
		historyApiFallback: true
	)

	app.use(webpackHotMiddleware compiler, { path: "/__webpack_hmr" })

	app.use "*", (req, res, next) ->
		filename = path.join compiler.outputPath, "index.html"
		compiler.outputFileSystem.readFile filename, (err, result) ->
			if err
				return next err
			res.set "content-type", "text/html"
			res.send result
			res.end()

else
	app.use(express.static(path.resolve __dirname, "../client"))
	app.get "*", (req, res) ->
		res.sendFile(path.resolve __dirname, "../client/index.html")

# Run backwards compatible updates first
runUpdates
	db:    db
	store: store
, ->
	port = config.server.port
	server.listen process.env.PORT or port, ->
		log.info "Server listening on :#{port}"

	main()
