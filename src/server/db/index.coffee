mongoose   = require "mongoose"
mongodbUri = require "mongodb-uri"
log        = (require "../lib/Logger") "db"

module.exports = (config) ->
	{ hosts, name, options } = config
	mongoose.Promise         = global.Promise
	url                      = mongodbUri.format
		hosts:    hosts
		database: name
		options:  options or null

	mongoose.connect url, useMongoClient: true, (error) ->
		return log.error "Error connecting to mongodb: #{error.message}" if error

		log.info "Connected to MongoDB"

	Configuration:  (require "./ConfigurationModel")  mongoose
	Group:          (require "./GroupModel")          mongoose
	RegistryImages: (require "./RegistryImagesModel") mongoose
	DeviceSource:   (require "./DeviceSource")        mongoose
	AllowedImage:   (require "./AllowedImageModel")   mongoose
