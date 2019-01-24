{ map, first } = require "lodash"

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

		await db.AllowedImage.create { name }

		images               = await getRegistryImages [name]
		{ versions, access } = first Object.values images

		await db.RegistryImages.create
			name:     prependRegistryUrl name
			versions: versions
			access:   access

	removeRegistryImage = ({ payload }) ->
		{ name, image } = payload

		configurations = await store.getConfigurations()
		return Promise.reject "Unable to remove this registry images" if isRegistryImageDependentOn image, configurations

		Promise.all [
			db.AllowedImage.findOneAndRemove { name }
			db.RegistryImages.findOneAndRemove name: image
		]

	storeRegistryImages = ({ payload: images }) ->
		store.storeRegistryImages images

	refreshRegistryImages = ({ payload }) ->
		images = await db
			.AllowedImage
			.find {}
			.select "name"
			.lean()
		names  = map images, "name"
		images = await getRegistryImages names

		storeRegistryImages payload: images

	storeRegistryImages:   storeRegistryImages
	refreshRegistryImages: refreshRegistryImages
	addRegistryImage:      addRegistryImage
	removeRegistryImage:   removeRegistryImage
