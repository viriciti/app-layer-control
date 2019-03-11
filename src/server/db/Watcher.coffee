{ EventEmitter } = require "events"
{ invokeMap }    = require "lodash"
debug            = (require "debug") "app:Watcher"
{ Observable }   = require "rxjs"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

class Watcher extends EventEmitter
	constructor: ({ @db, @store, @mqtt }) ->
		super()

		@observables = []

	unwatch: ->
		invokeMap @changeStreams, "close"

	watch: ->
		@unwatch()

		@changeStreams = [
			@db
				.Application
				.watch()
				.on "change", @onCollectionChange

			@db
				.Group
				.watch()
				.on "change", @onCollectionChange

			@db
				.DeviceGroup
				.watch [], fullDocument: "updateLookup"
				.on "change", @onDeviceGroupChange

			@db
				.RegistryImages
				.watch()
				.on "change", @onCollectionChange
		]

	onCollectionChange: ({ ns }) =>
		debug "Collection change - #{ns.db}.#{ns.coll} changed"

		populateMqttWithGroups @db, @mqtt

	onDeviceGroupChange: ({ fullDocument, operationType }) =>
		# todo: we currently don't know how to handle "delete" operations
		return if operationType is "delete"

		{ deviceId, groups } = fullDocument
		debug "Groups for #{deviceId} updated: #{groups.join ', '}"

		topic                = "devices/#{deviceId}/groups"
		groups               = JSON.stringify groups
		options              = retain: true

		@mqtt.publish topic, groups, options

module.exports = Watcher
