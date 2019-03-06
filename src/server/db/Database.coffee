config      = require "config"
mongodbURI  = require "mongodb-uri"
mongoose    = require "mongoose"
{ forEach } = require "lodash"
log         = (require "../lib/Logger") "Database"

readyStates =
	DISCONNECTED:  0
	CONNECTED:     1
	CONNECTING:    2
	DISCONNECTING: 3

models =
	AllowedImage:   require "./models/AllowedImage"
	Application:    require "./models/Application"
	DeviceGroup:    require "./models/DeviceGroup"
	DeviceSource:   require "./models/DeviceSource"
	Group:          require "./models/Group"
	RegistryImages: require "./models/RegistryImages"

class Database
	constructor: (@options) ->
		@options = Object.assign {},
			autoConnect: false
		, @options

		@connect() if @options.autoConnect

	expandHosts: (hosts) ->
		hosts
			.split ","
			.map (host) ->
				[url, port] = host.split ":"
				port      or= 27017

				host: url
				port: port

	connect: ->
		forEach models, (model, name) =>
			return if @[name]
			@[name] = model

		if mongoose.connection.readyState is readyStates.DISCONNECTED
			log.info "Connecting to MongoDB ..."

			mongoose.Promise = global.Promise
			url              = mongodbURI.format
				hosts:    @expandHosts config.db.hosts
				database: config.db.name
				options:  config.db.options or undefined

			await mongoose.connect url,
				useCreateIndex:   true
				useFindAndModify: false
				useNewUrlParser:  true

			log.info "Connected. Following calls will reuse the (open) connection"

		mongoose

module.exports = Database
