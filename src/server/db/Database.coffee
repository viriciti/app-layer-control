config      = require "config"
mongodbURI  = require "mongodb-uri"
mongoose    = require "mongoose"
{ forEach } = require "lodash"

models     =
	AllowedImage:   (require "./models/AllowedImage")   mongoose
	Configuration:  (require "./models/Configuration")  mongoose
	DeviceGroup:    (require "./models/DeviceGroup")    mongoose
	DeviceSource:   (require "./models/DeviceSource")   mongoose
	Group:          (require "./models/Group")          mongoose
	RegistryImages: (require "./models/RegistryImages") mongoose

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
