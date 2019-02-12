{ EventEmitter } = require "events"
{ invokeMap }    = require "lodash"
debug            = (require "debug") "app:Watcher"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

class Watcher extends EventEmitter
	constructor: ({ @db, @store, @mqtt }) ->
		super()

		@changeStreams = []

	unwatch: ->
		invokeMap @changeStreams, "close"

	watch: ->
		@unwatch()

		applicationChangeStream = @db.Configuration.watch()
		groupChangeStream       = @db.Group.watch()
		deviceGroupChangeStream = @db.DeviceGroup.watch [], fullDocument: "updateLookup"

		applicationChangeStream.on "change", @onCollectionChange
		groupChangeStream.on       "change", @onCollectionChange
		deviceGroupChangeStream.on "change", @onDeviceGroupChange

		@changeStreams = [
			applicationChangeStream
			groupChangeStream
			deviceGroupChangeStream
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
