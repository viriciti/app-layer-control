{ EventEmitter }       = require "events"
{ invokeMap, partial } = require "lodash"
debug                  = (require "debug") "app:Watcher"
{ Observable }         = require "rxjs"
log                    = (require "../lib/Logger") "Watcher"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"
Broadcaster            = require "../Broadcaster"

class Watcher extends EventEmitter
	constructor: ({ @db, @store, @mqtt, @broadcaster }) ->
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
				.on "change",  @onCollectionChange
				.once "close", partial @onChangeStreamClose, "Application"

			@db
				.Group
				.watch()
				.on "change",  @onCollectionChange
				.once "close", partial @onChangeStreamClose, "Group"

			@db
				.DeviceState
				.watch()
				.on "change",  @onDeviceChange
				.once "close", partial @onChangeStreamClose, "DeviceGroup"

			@db
				.RegistryImages
				.watch()
				.on "change",  @onCollectionChange
				.once "close", partial @onChangeStreamClose, "RegistryImages"
		]

	onChangeStreamClose: (model) =>
		log.error "ChangeStream for model #{model} closed"

	onCollectionChange: ({ ns }) =>
		debug "Collection change - #{ns.db}.#{ns.coll} changed"

		populateMqttWithGroups @db, @mqtt

	onDeviceChange: ({ updateDescription, operationType, documentKey }) =>
		return if operationType is "delete"

		updatedFields = updateDescription?.updatedFields or {}
		{ deviceId }  = await @db.DeviceState.findOne(documentKey).select "deviceId"

		@broadcaster.broadcast Broadcaster.STATE, Object.assign {}, [deviceId]: updatedFields

		# Additionally, publish groups on MQTT
		return unless updatedFields.groups

		# Since we're only interested in the full document once,
		# the groups have changed, we do the lookup manually
		
		topic   = "devices/#{deviceId}/groups"
		groups  = JSON.stringify updatedFields.groups
		options = retain: true

		@mqtt.publish topic, groups, options

module.exports = Watcher
