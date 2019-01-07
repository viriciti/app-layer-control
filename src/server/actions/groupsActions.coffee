async                                 = require "async"
config                                = require "config"
{ flattenDeep, compact, uniqBy, map } = require "lodash"

debug = (require "debug") "app:actions:groupsActions"

module.exports = (db, mqttSocket) ->
	{ enrich } = (require "../helpers/enrichAppsForMqtt") db

	getDefaultGroup = ->
		await db
			.Group
			.findOne label: "default"
			.select "_id"
			.lean()

	publishGroupsForDevice = (deviceId) ->
		new Promise (resolve, reject) ->
			query   = deviceId: deviceId
			topic   = "devices/#{deviceId}/groups"
			options = retain  : true
			groups  = JSON.stringify map (await db
				.DeviceGroup
				.findOne query
				.populate "groups", "label -_id"
				.select "groups"
				.lean()
			).groups, "label"

			mqttSocket.publish topic, groups, options, (error) ->
				return reject error if error
				resolve()

	createGroup = ({ payload }, cb) ->
		{ label } = payload

		async.series [
			(cb) ->
				return cb() if label is "default"

				db.Group.findOne { label: "default" }, (error, group) ->
					return cb error if error
					return cb new Error "Group 'default' must exist prior to other groups" unless group

					cb()
			(cb) ->
				db.Group.findOneAndUpdate { label }, payload, { upsert: true }, cb

			publishGroups

		], (error) ->
			return cb error if error
			cb null, "Group #{label} created correctly"

	removeDeviceGroup = ({ payload }, cb) ->
		{ payload, dest } = payload
		query             = deviceId: dest
		{ _id: id }       = await db
			.Group
			.findOne label: payload
			.select "_id"
			.lean()

		groups = (await db
			.DeviceGroup
			.findOne query
			.populate "groups", "_id"
			.lean()
		)
			.groups
			.filter ({ _id }) ->
				_id.toString() isnt id.toString()

		await db
			.DeviceGroup
			.findOneAndUpdate query, groups: groups

		await publishGroupsForDevice dest

		cb()

	removeGroup = ({ payload: label }, cb) ->
		db.Group.findOneAndRemove { label }, (error) ->
			return cb error if error

			publishGroups (error) ->
				return cb error if error
				cb null, "Group #{label} removed correctly"

	publishGroups = (cb) ->
		async.waterfall [
			(cb) ->
				db.Group.find {}, cb

			(groups, cb) ->
				async.reduce groups, {}, (memo, group, cb) ->
					enrich group.label, group.applications, (error, appsToInstall) ->
						return cb error if error

						memo[group.label] = appsToInstall
						cb null, memo
				, cb

			(enrichedGroups, cb) ->
				if config.readOnly
					debug "Read only mode, not sending enriched groups to MQTT"
					return cb()

				topic   = "global/collections/groups"
				message = JSON.stringify enrichedGroups
				options = retain: true

				mqttSocket.publish topic, message, options, cb
		], cb

	storeGroups = ({ payload }, cb) ->
		{ payload, dest } = payload
		query             = deviceId: dest
		current           = await db
			.DeviceGroup
			.findOne query
			.populate "groups", "_id"
			.lean()
		currentGroups = current?.groups or [await getDefaultGroup()]
		groups        = await db
			.Group
			.find label: "$in": payload
			.select "_id"
			.lean()

		uniqById = ({ _id: id }) -> id.toString()
		update   = groups: uniqBy compact(flattenDeep [currentGroups..., groups...]), uniqById

		await db
			.DeviceGroup
			.findOneAndUpdate query, update, upsert: true

		await publishGroupsForDevice dest

		cb()

	return {
		createGroup
		removeGroup
		removeDeviceGroup
		publishGroups
		storeGroups
	}
