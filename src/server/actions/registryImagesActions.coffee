async     = require "async"
config    = require "config"
{ pluck } = require "underscore"

getRegistryImages = require "../lib/getRegistryImages"

module.exports = (db, mqttSocket) ->
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

	refreshRegistryImages = ({ payload }, cb) ->
		async.waterfall [
			(next) ->
				db.AllowedImage.find {}, next
			(images, next) ->
				getRegistryImages pluck(images, "name"), next
			(images, next) ->
				storeRegistryImages payload: images, next
		], cb

	return {
		storeRegistryImages
		refreshRegistryImages
		removeUnavailableRegistryImage
	}
