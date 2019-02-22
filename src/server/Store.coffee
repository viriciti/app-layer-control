config                                    = require "config"
pMap                                      = require "p-map"
{ Map, fromJS, Iterable }                 = require "immutable"
{ object, pluck }                         = require "underscore"
{ toPairs, mapValues, map, reduce, without } = require "lodash"

Database = require "./db/Database"
log      = (require "./lib/Logger") "store"

class Store
	constructor: (@db) ->
		@db  or= new Database autoConnect: true
		@bag   = Map()

	kick: ->
		[
			configurations
			groups
			registryImages
			deviceSources
			allowedImages
		] = await Promise.all [
			@getConfigurations()
			@getGroups()
			@getRegistryImages()
			@getDeviceSources()
			@getAllowedImages()
		]

		Map
			configurations: configurations
			groups:         groups
			registryImages: registryImages
			deviceSources:  deviceSources
			allowedImages:  allowedImages

	storeRegistryImages: (images) ->
		pMap toPairs(images), ([name, { versions, access, exists }]) =>
			await @db.RegistryImages.findOneAndUpdate { name },
				{ name, versions, access, exists }
				{ upsert: true }

	getAllowedImages: ->
		images = await @db.AllowedImage.find().lean()
		images = Object.values mapValues images, (image) -> image.name

		fromJS images

	getRegistryImages: ->
		images = await @db.RegistryImages.find().lean()
		images = images.reduce (memo, { name, versions, access, exists }) ->
			Object.assign {}, memo,
				"#{name}":
					versions: versions
					access:   access
					exists:   exists
		, {}

		fromJS images

	getConfigurations: ->
		configurations = await @db
			.Configuration
			.find {}
			.select "-_id -__v"
			.lean()

		configurations = configurations.reduce (memo, configuration) ->
			{ applicationName } = configuration

			Object.assign {}, memo,
				"#{applicationName}": configuration
		, {}

		fromJS configurations

	getGroups: ->
		groups = await @db.Group.find()
		groups = reduce groups, (memo, { label, applications }) ->
			memo[label] = applications
			memo
		, {}

		fromJS groups

	getDeviceGroups: (devices) ->
		deviceGroups = await @db
			.DeviceGroup
			.find deviceId: $in: devices
			.select "-_id -__v"
			.lean()

		fromJS deviceGroups


	getDeviceSources: ->
		sources = await @db
			.DeviceSource
			.find()
			.select "-_id -__v"
			.lean()
		sources = object (pluck sources, "getIn"), sources

		fromJS sources

	ensureDefaultGroups: (devices) ->
		devicesWithGroups = map (await @db
			.DeviceGroup
			.find deviceId: $in: devices
			.select "deviceId"
			.lean()
		), "deviceId"
		insertFor = without devices, ...devicesWithGroups
		insert    = insertFor.map (deviceId) ->
			deviceId: deviceId
			groups:   ["default"]

		@db.DeviceGroup.insertMany insert, rawResult: true

	ensureDefaultDeviceSources: ->
		sourcesCount = await @db.DeviceSource.countDocuments()
		return log.warn "Sources have been configured already" if sourcesCount

		@db.DeviceSource.create config.defaultColumns

	set: (key, value) ->
		throw new Error "Value must be Immutable" unless Iterable.isIterable value

		@bag = @bag.set key, value

	get: (key) ->
		@bag.get key

	getAll: ->
		@bag

	# @deprecated: Do not use in production
	getEnabledRegistryImages: (cb) ->
		log.warn "'getEnabledRegistryImages' is deprecated ..."

		images = await @db.RegistryImages.find {}
		images = images.reduce (memo, data) ->
			{ name }   = data
			memo[name] = data
				.toJSON()
				.enabledVersion
			memo
		, {}

		fromJS images

module.exports = Store
