config                         = require "config"
map                            = require "p-map"
{ Map, fromJS, Iterable }      = require "immutable"
{ object, pluck }              = require "underscore"
{ toPairs, mapValues, reduce } = require "lodash"

Database = require "./db"
log      = (require "./lib/Logger") "store"

class Store
	constructor: (@db) ->
		@db  or= new Database autoConnect: true
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

		Map
			configurations: configurations
			groups:         groups
			registryImages: registryImages
			deviceSources:  deviceSources
			allowedImages:  allowedImages

	storeRegistryImages: (images) ->
		map toPairs(images), ([name, { versions, access, exists }]) =>
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
		groups = await @db.Group.find {}
		groups = reduce groups, (memo, { label, applications }) ->
			memo[label] = applications
			memo
		, {}

		fromJS groups

	getDeviceSources: ->
		sources = await @db
			.DeviceSource
			.find()
			.select "-_id -__v"
			.lean()
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
		@setCache "configurations", configs

	cacheEnabledRegistryImages: (enabledRegistryImages) ->
		@setCache "enabledRegistryImages", enabledRegistryImages

	cacheRegistryImages: (images) ->
		@setCache "registryImages", images

	cacheGroups: (groups) ->
		@setCache "groups", groups

	setCache: (section, value) ->
		throw new Error "Will not cache non-Immutable values" unless Iterable.isIterable value

		@cache = @cache.set section, value

	getCache: (section) ->
		return @cache.get section if section

		@cache

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
