{ EventEmitter }       = require "events"
{ invokeMap, partial } = require "lodash"
debug                  = (require "debug") "app:Watcher"
{ Observable }         = require "rxjs"
log                    = (require "../lib/Logger") "Watcher"

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

		{ updatedFields } = updateDescription
		return unless updatedFields?.groups

		# Since we're only interested in the full document once,
		# the groups have changed, we do the lookup manually
		{ deviceId } = await @db.DeviceState.findOne(documentKey).select "deviceId"
		
		topic   = "devices/#{deviceId}/groups"
		groups  = JSON.stringify await @db.Group.find(_id: $in: updatedFields.groups).distinct "label"
		options = retain: true

		@mqtt.publish topic, groups, options

module.exports = Watcher
