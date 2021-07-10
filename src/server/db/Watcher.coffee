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
				populateMqttWithGroups @db, @mqtt

	watchState: (observable$) ->
		observable$
			.filter (obj) ->
				debug "INCOMING %O", obj
				{ operationType, updateDescription, fullDocument } = obj
				debug "operationType %s, updateDescription %o, filter %s", operationType, updateDescription, operationType isnt "delete" and updateDescription?.updatedFields?
				operationType isnt "delete" and (updateDescription?.updatedFields?) or fullDocument
			.concatMap ({ documentKey, updateDescription, fullDocument }) =>
				_id = documentKey or fullDocument._id
				debug "getting device state from DB for document key", documentKey
				Observable
					.from @db.DeviceState.findOne(_id).select "deviceId"
					.map ({ deviceId }) ->
						deviceId:      deviceId
						updatedFields: updateDescription?.updatedFields or fullDocument
			.concatMap ({ deviceId, updatedFields  }) =>
				debug "UDATED FIELDS %s, %O", deviceId, updatedFields
				value =
					deviceId: deviceId
					data:     updatedFields

				# We only want to publish the updated groups on MQTT
				unless updatedFields.groups
					debug "No groups in updated fields for device %s", deviceId
					return Observable.of value

				topic   = "devices/#{deviceId}/groups"
				groups  = JSON.stringify updatedFields.groups
				options = retain: true

				debug "Publishing updated groups %s for device %s", groups, deviceId

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

				@broadcaster.broadcast Broadcaster.STATE, updates

module.exports = Watcher
