async                                          = require "async"
config                                         = require "config"
{ map, chain, reduce, pick, mapObject, pluck } = require "underscore"
semver                                         = require "semver"

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
		async.mapValues images, ({ versions, access, exists }, name, cb) ->
			async.series [
				(next) ->
					db.RegistryImages.findOneAndRemove { name }, next
				(next) ->
					db.RegistryImages.findOneAndUpdate { name },
						{ name, versions, access, exists },
						{ upsert: true, new: true },
						next
			], cb
		, cb

	refreshRegistryImages = ({ payload: images }, cb) ->
		async.waterfall [
			(next) ->
				db.AllowedImage.find {}, next
			(images, next) ->
				versioning.getImages pluck(images, "name"), (error, result) ->
					return next error if error

					next null, reduce result, (memo, { versions, access, exists }, imageName) ->
						versions = chain versions
							.without "latest", "1"
							.sort (left, right) ->
								return -1 unless semver.valid left
								return 1  unless semver.valid right
								semver.compare left, right
							.last config.versioning.numOfVersionsToShow
							.value()

						memo["#{config.versioning.docker.host}/#{imageName}"] = { versions, access, exists }
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
