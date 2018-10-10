async                                   = require "async"
config                                  = require "config"
{ map, chain, reduce, pick, mapObject } = require "underscore"
semver                                  = require "semver"

Versioning = require "../lib/Versioning"

versioning = new Versioning config.versioning

module.exports = (db, mqttSocket) ->
	populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

	removeUnavailableRegistryImage = ({ payload }, cb) ->
		{ name, image } = payload

		async.parallel [
			(cb) ->
				db.AllowedImage.findOneAndRemove { name }, cb
			(cb) ->
				db.RegistryImages.findOneAndRemove name: image, cb
		], (error) ->
			return cb error if error
			cb null, "Registry image #{name} removed"

	storeRegistryImages = ({ payload: images }, cb) ->
		async.mapValues images, ({ versions, exists }, name, cb) ->
			db.RegistryImages.findOneAndUpdate { name },
				{ name, versions, exists },
				{ upsert: true, new: true },
				cb
		, cb

	refreshRegistryImages = ({ payload: images }, cb) ->
		async.waterfall [
			(next) ->
				db.AllowedImage.find {}, next
			(images, next) ->
				images = map images, (i) -> i.name

				versioning.getImages images, (error, result) ->
					return next error if error

					next null, reduce result, (memo, { versions, exists }, imageName) ->
						versions = chain versions
							.without "latest", "1"
							.filter semver.valid
							.sort semver.compare
							.last config.versioning.numOfVersionsToShow
							.value()

						memo["#{config.versioning.docker.host}/#{imageName}"] = { versions, exists }
						memo
					, {}
			(images, next) ->
				storeRegistryImages payload: images, next
		], cb

	return {
		storeRegistryImages
		refreshRegistryImages
		removeUnavailableRegistryImage
	}
