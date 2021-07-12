{ EventEmitter }                          = require "events"
{ each, partial, negate, isEmpty, merge } = require "lodash"
debug                                     = (require "debug") "app:Watcher"
{ Observable }                            = require "rxjs"
log                                       = (require "../lib/Logger") "Watcher"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"
Broadcaster            = require "../Broadcaster"

class Watcher extends EventEmitter
	constructor: ({ @db, @store, @mqtt, @broadcaster }) ->
		super()

		@observables   = []

	unwatch: ->
		@observables.forEach (observable) ->
			observable.unsubscribe()

	watch: ->
		state$          = Observable.fromEvent @db.DeviceState.watch(), "change"
		application$    = Observable.fromEvent @db.Application.watch(), "change"
		group$          = Observable.fromEvent @db.Group.watch(), "change"
		registryImages$ = Observable.fromEvent @db.RegistryImages.watch(), "change"

		@observables.push @watchAdministration application$, group$, registryImages$
		@observables.push @watchState state$

	watchAdministration: (...observables$) ->
		Observable
			.merge observables$...
			.subscribe =>
				debug "[admin] Populating all groups due to changes in administation"
				populateMqttWithGroups @db, @mqtt

	watchState: (observable$) ->
		observable$
			# filter out delete operations and get update or full doc info
			# fullDocument comes from inseart operation
			# updateDescription.updatedFields comes from an update operation
			.filter (obj) ->
				debug "[device state] Incoming %O", obj
				{ operationType, updateDescription, fullDocument } = obj
				operationType isnt "delete" and (updateDescription?.updatedFields?) or fullDocument
			.concatMap ({ documentKey, updateDescription, fullDocument }) =>
				# documentKey comes from update operation
				# fullDocument._id comes from insert operation
				_id = documentKey or fullDocument._id
				debug "[device state] Getting device id from DeviceState DB for document key", _id
				Observable
					.from @db.DeviceState.findOne(_id).select "deviceId"
					.map ({ deviceId }) ->
						deviceId:      deviceId
						updatedFields: updateDescription?.updatedFields or fullDocument
			.concatMap ({ deviceId, updatedFields  }) =>
				value =
					deviceId: deviceId
					data:     updatedFields

				# We only want to publish the updated groups on MQTT
				unless updatedFields.groups
					debug "[device state] No groups in updated fields for device %s", deviceId
					return Observable.of value

				topic   = "devices/#{deviceId}/groups"
				groups  = JSON.stringify updatedFields.groups
				options = retain: true

				debug "[device state] Publishing updated groups %s for device %s", groups, deviceId

				Observable
					.from @mqtt.publish topic, groups, options
					.mapTo value
			.bufferTime 500
			.filter negate isEmpty
			.subscribe (updates) =>
				updates = updates.reduce (updates, { deviceId, data }) ->
					updates[deviceId] = merge {}, updates[deviceId], data
					updates
				, {}

				debug "[device state] Broadcasting device state %O", updates
				@broadcaster.broadcast Broadcaster.STATE, updates

module.exports = Watcher
