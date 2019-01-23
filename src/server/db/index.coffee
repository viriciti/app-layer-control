config      = require "config"
mongodbURI  = require "mongodb-uri"
mongoose    = require "mongoose"
{ forEach } = require "lodash"

models     =
	AllowedImage:   (require "./AllowedImage")   mongoose
	Configuration:  (require "./Configuration")  mongoose
	DeviceGroup:    (require "./DeviceGroup")    mongoose
	DeviceSource:   (require "./DeviceSource")   mongoose
	Group:          (require "./Group")          mongoose
	RegistryImages: (require "./RegistryImages") mongoose

class Database
	constructor: (@options) ->
		@options = Object.assign {},
			autoConnect: false
		, @options

		@connect() if @options.autoConnect

	connect: ->
		mongoose.Promise = global.Promise
		url              = mongodbURI.format
			hosts:    config.db.hosts
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
