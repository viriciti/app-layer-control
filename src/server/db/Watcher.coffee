{ EventEmitter } = require "events"
debug            = (require "debug") "app:Watcher"

class Watcher extends EventEmitter
	constructor: ({ @db, @store }) ->
		super()

	start: ->
		@db
			.Configuration
			.watch()
			.on "change", @onApplicationChange

		@db
			.RegistryImages
			.watch()
			.on "change", @onRegistryChange

		@db
			.AllowedImage
			.watch()
			.on "change", @onRegistryChange

		@db
			.Group
			.watch()
			.on "change", @onGroupChange

		@db
			.DeviceSource
			.watch()
			.on "change", @onSourceChange

		@db
			.DeviceGroup
			.watch()
			.on "change", @onDeviceGroupChange

	onApplicationChange: (fields) =>
		{ operationType } = fields
		debug "onApplicationChange: #{operationType}"

		return unless operationType in ["update", "delete", "insert"]

		configurations = await @store.getConfigurations()

		@store.set "configurations", configurations
		@emit "applications", { ...fields, data: configurations }

	onRegistryChange: (fields) =>
		{ operationType }               = fields
		[registryImages, allowedImages] = await Promise.all [
			@store.getRegistryImages()
			@store.getAllowedImages()
		]

		debug "onRegistryChange: #{operationType}"

		@store.set "registry", registryImages
		@emit "registry", Object.assign {},
			fields
			data:
				allowedImages:  allowedImages
				registryImages: registryImages

	onGroupChange: (fields) =>
		{ operationType } = fields
		groups            = await @store.getGroups()

		debug "onGroupChange: #{operationType}"

		@store.set "groups", groups
		@emit "groups", { ...fields, data: groups }

	onDeviceGroupChange: (fields) =>
		# console.log fields

	onSourceChange: (fields) =>
		{ operationType } = fields
		sources           = await @store.getDeviceSources()

		debug "onSourceChange: #{operationType}"

		@emit "sources", { ...fields, data: sources }

module.exports = Watcher
