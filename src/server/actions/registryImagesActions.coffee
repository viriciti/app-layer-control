async                    = require "async"
config                   = require "config"
{ pluck, first, values } = require "underscore"

getRegistryImages  = require "../lib/getRegistryImages"
prependRegistryUrl = require "../helpers/prependRegistryUrl"

module.exports = (db, mqttSocket) ->
	addRegistryImage = ({ payload }, cb) ->
		{ name } = payload

		async.parallel [
			(cb) ->
				db.AllowedImage.create { name }, cb
			(cb) ->
				async.waterfall [
					(next) ->
						getRegistryImages [name], next
					(images, next) ->
						{ versions, access } = first values images

						db.RegistryImages.create
							name:     prependRegistryUrl name
							versions: versions
							access:   access
						, next
				], cb
		], cb

	removeRegistryImage = ({ payload }, cb) ->
		{ name, image } = payload

		async.parallel [
			(cb) ->
				db.AllowedImage.findOneAndRemove { name }, cb
			(cb) ->
				db.RegistryImages.findOneAndRemove name: image, cb
		], cb

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
		addRegistryImage
		removeRegistryImage
	}
