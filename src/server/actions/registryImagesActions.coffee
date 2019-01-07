async                    = require "async"
config                   = require "config"
{ pluck, first, values } = require 'underscore'

getRegistryImages  = require "../lib/getRegistryImages"
prependRegistryUrl = require "../helpers/prependRegistryUrl"

isRegistryImageDependentOn = (image, configurations) ->
	configurations
		.map (configuration) ->
			configuration.get "fromImage"
		.valueSeq()
		.toArray()
		.includes image

module.exports = (db, mqttSocket, store) ->
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

		store.getConfigurations (error, configurations) ->
			return cb error                                                                if error
			return cb new Error "One or more configurations depend on this registry image" if isRegistryImageDependentOn image, configurations

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
