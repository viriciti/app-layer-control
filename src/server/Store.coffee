config                         = require "config"
map                            = require "p-map"
{ Map, fromJS }                = require "immutable"
{ object, pluck }              = require "underscore"
{ toPairs, mapValues, reduce } = require "lodash"

log = (require "./lib/Logger") "store"

class Store
	constructor: (@db) ->
		@db.connect()

		@cache = Map()

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

		fromJS
			configurations: configurations
			groups:         groups
			registryImages: registryImages
			deviceSources:  deviceSources
			allowedImages:  allowedImages

	storeRegistryImages: (images) ->
		map toPairs(images), ([name, { versions, access, exists }]) =>
			await @db.RegistryImages.findOneAndRemove { name }
			await @db.RegistryImages.findOneAndUpdate { name },
				{ name, versions, access, exists }
				{ upsert: true }

	getAllowedImages: ->
		images = await @db.AllowedImage.find {}
		images = Object.values mapValues images, (image) -> image.name

		fromJS images

	getRegistryImages: ->
		images = await @db.RegistryImages.find {}
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

		configurations = reduce configurations, (memo, configuration) ->
			{ applicationName } = configuration

			Object.assign {}, memo,
				"#{applicationName}": configuration
		, {}

		fromJS configurations

	getGroups: ->
		groups = await @db.Group.find {}
		groups = reduce groups, (memo, { label, applications }) ->
			memo[label] = applications
			memo
		, {}

		fromJS groups

	getDeviceSources: ->
		sources = await @db.DeviceSource.find {}
		sources = object (pluck sources, "getIn"), sources

		fromJS sources

	ensureDefaultDeviceSources: ->
		Promise.all toPairs(config.defaultColumns).map ([name, column]) =>
			query   = name: name
			options =
				upsert:              true
				setDefaultsOnInsert: true

			@db.DeviceSource.findOneAndUpdate query, column, options

	cacheConfigurations: (configs) ->
		@cache = @cache.set "configurations", configs

	cacheEnabledRegistryImages: (enabledRegistryImages) ->
		@cache = @cache.set "enabledRegistryImages", enabledRegistryImages

	cacheRegistryImages: (images) ->
		@cache = @cache.set "registryImages", images

	cacheGroups: (groups) ->
		@cache = @cache.set "groups", groups

	getCache: (section) ->
		return @cache.get section if section

		@cache

	# @deprecated: Do not use in production
	getEnabledRegistryImages: (cb) ->
		log.warn "'getEnabledRegistryImages' is deprecated ..."

		@db.RegistryImages.find {}, (error, images) ->
			return cb error if error
			cb null, fromJS images.reduce (memo, data) ->
				{ name }   = data
				memo[name] = data
					.toJSON()
					.enabledVersion
				memo
			, {}

module.exports = Store
