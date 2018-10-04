_                     = require "underscore"
async                 = require "async"
config                = require "config"
{ Map, List, fromJS } = require "immutable"

module.exports = (db) ->
	{ storeRegistryImages } = (require "./actions/registryImagesActions") db

	# An immutable map keyed on clientId containing a client's state
	cache          = Map()

	kick = (cb) ->
		async.parallel
			configurations:        getConfigurations
			groups:                getGroups
			enabledRegistryImages: getEnabledRegistryImages
			registryImages:        getRegistryImages
			deviceSources:         getDeviceSources
			allowedImages:         getAllowedImages
		, (error, store) ->
			return cb error if error

			cb null, fromJS store

	setImages = (images, cb) ->
		storeRegistryImages images, cb

	getAllowedImages = (cb) ->
		db.AllowedImage.find {}, (error, images) ->
			return cb error if error
			cb null, List _.map images, (i) -> i.name

	getRegistryImages = (cb) ->
		db.RegistryImages.find {}, (error, images) ->
			return cb error if error
			cb null, fromJS images.reduce (memo, { name, versions, exists }) ->
				memo[name] = { versions, exists }
				memo
			, {}

	getEnabledRegistryImages = (cb) ->
		db.RegistryImages.find {}, (error, images) ->
			return cb error if error
			cb null, fromJS images.reduce (memo, { name, enabledVersion }) ->
				memo[name] = enabledVersion
				memo
			, {}

	getConfigurations = (cb) ->
		db.Configuration.find {}, (error, configurations) ->
			return cb error if error
			cb null, fromJS _.reduce configurations, (configsObj, config) ->
				configObj = {}
				configObj[config.applicationName] = (_.omit config.toObject(), ["_id", "__v"])
				configsObj = _.extend {}, configsObj, configObj

				return configsObj
			, {}

	getGroups = (cb) ->
		db.Group.find {}, (error, groups) ->
			return cb error if error
			cb null, fromJS _.reduce groups, (groupsObj, group) ->
				groupObj = {}
				groupObj[group.label] = group.applications
				groupsObj = _.extend {}, groupsObj, groupObj

				return groupsObj
			, {}

	getDeviceSources = (cb) ->
		db.DeviceSource.find {}, (error, deviceSources) ->
			return cb error if error

			# Create an object using getIn as key
			deviceSources = _.object (_.pluck deviceSources, "getIn"), deviceSources

			# Convert to immutable Map
			deviceSources = Map deviceSources

			cb null, deviceSources

	ensureDefaultDeviceSources = (cb) ->
		async.eachOf config.defaultColumns, (column, key, next) ->
			db.DeviceSource.findOneAndUpdate
				getIn: column.getIn,
				column,
				{ upsert: true, setDefaultsOnInsert: true, new: true }
			, next
		, cb

	cacheConfigurations = (configs) ->
		cache = cache.set "configurations", configs

	cacheEnabledRegistryImages = (enabledRegistryImages) ->
		cache = cache.set "enabledRegistryImages", enabledRegistryImages

	cacheRegistryImages = (images) ->
		cache = cache.set "registryImages", images

	cacheGroups = (groups) ->
		cache = cache.set "groups", groups

	getCache = (section) ->
		return cache.get section if section

		cache

	return {
		getConfigurations
		getDeviceSources
		getAllowedImages
		getEnabledRegistryImages
		getGroups
		getRegistryImages
		kick
		setImages

		cacheConfigurations
		cacheEnabledRegistryImages
		cacheRegistryImages
		cacheGroups
		getCache
		ensureDefaultDeviceSources
	}
