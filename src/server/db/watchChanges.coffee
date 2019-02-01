debug = (require "debug") "app:watchChanges"

module.exports = ({ db, store, broadcast }) ->
	onApplicationChange = ({ operationType }) ->
		debug "onApplicationChange: #{operationType}"


		configurations = await store.getConfigurations()

		store.cacheConfigurations configurations
		broadcast "configurations", configurations

		console.log "broadcast configs"
		# if operationType in ["update", "delete", "insert"]

	onRegistryChange = ({ operationType }) ->
		[registryImages, allowedImages] = await Promise.all [
			store.getRegistryImages()
			store.getAllowedImages()
		]

		debug "onRegistryChange: #{operationType}"

		store.cacheRegistryImages registryImages
		broadcast "registryImages", registryImages
		broadcast "allowedImages",  allowedImages

	onGroupChange = ({ operationType }) ->
		groups = await store.getGroups()

		debug "onGroupChange: #{operationType}"

		store.cacheGroups groups
		broadcast "groups", groups

	onSourceChange = ({ operationType }) ->
		debug "onSourceChange: #{operationType}"

		broadcast "deviceSources", await store.getDeviceSources()

	db
		.Configuration
		.watch()
		.on "change", onApplicationChange

	db
		.RegistryImages
		.watch()
		.on "change", onRegistryChange

	db
		.AllowedImage
		.watch()
		.on "change", onRegistryChange

	db
		.Group
		.watch()
		.on "change", onGroupChange

	db
		.DeviceSource
		.watch()
		.on "change", onSourceChange
