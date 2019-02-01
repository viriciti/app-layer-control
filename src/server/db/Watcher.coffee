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

	onApplicationChange: ({ operationType }) =>
		debug "onApplicationChange: #{operationType}"

		return unless operationType in ["update", "delete", "insert"]

		configurations = await @store.getConfigurations()

		@store.cacheConfigurations configurations
		@emit "any", "applications", configurations
		@emit "applications",        configurations

	onRegistryChange: ({ operationType }) =>
		[registryImages, allowedImages] = await Promise.all [
			@store.getRegistryImages()
			@store.getAllowedImages()
		]

		debug "onRegistryChange: #{operationType}"

		@store.cacheRegistryImages registryImages

		@emit "any", "registry",
			allowedImages:  allowedImages
			registryImages: registryImages

		@emit "registry",
			allowedImages:  allowedImages
			registryImages: registryImages

	onGroupChange: ({ operationType }) =>
		groups = await @store.getGroups()

		debug "onGroupChange: #{operationType}"

		@store.cacheGroups groups
		@emit "any", "groups", groups
		@emit "groups",        groups

	onSourceChange: ({ operationType }) =>
		sources = await @store.getDeviceSources()

		debug "onSourceChange: #{operationType}"

		@emit "any", "sources", sources
		@emit "sources",        sources

module.exports = Watcher
