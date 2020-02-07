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
			.filter ({ operationType, updateDescription }) ->
				operationType isnt "delete" and updateDescription?.updatedFields?
			.mergeMap ({ documentKey, updateDescription }) =>
				Observable
					.from @db.DeviceState.findOne(documentKey).select "deviceId"
					.map ({ deviceId }) ->
						deviceId:      deviceId
						updatedFields: updateDescription.updatedFields
			.mergeMap ({ deviceId, updatedFields  }) =>
				value =
					deviceId: deviceId
					data:     updatedFields

				# We only want to publish the updated groups on MQTT
				return Observable.of value unless updatedFields.groups

				topic   = "devices/#{deviceId}/groups"
				groups  = JSON.stringify updatedFields.groups
				options = retain: true

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
