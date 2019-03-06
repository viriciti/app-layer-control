config      = require "config"
mongodbURI  = require "mongodb-uri"
mongoose    = require "mongoose"
{ forEach } = require "lodash"

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
		mongoose.Promise = global.Promise
		url              = mongodbURI.format
			hosts:    @expandHosts config.db.hosts
			database: config.db.name
			options:  config.db.options or undefined

		forEach models, (model, name) =>
			return if @[name]
			@[name] = model

		mongoose
			.connect url,
				useCreateIndex:   true
				useFindAndModify: false
				useNewUrlParser:  true

module.exports = Database
