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
	connect: ->
		mongoose.Promise = global.Promise
		url              = mongodbURI.format
			hosts:    config.db.hosts
			database: config.db.name
			options:  config.db.options or undefined

		mongoose
			.connect url,
				useCreateIndex:   true
				useFindAndModify: false
				useNewUrlParser:  true
			.then =>
				forEach models, (model, name) =>
					throw new Error "Name collision: #{name}" if @[name]

					@[name] = model

module.exports = Database
