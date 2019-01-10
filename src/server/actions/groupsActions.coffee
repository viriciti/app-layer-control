async                      = require "async"
config                     = require "config"
{ compact, uniq, without } = require "lodash"
{ promisify }              = require "util"

debug = (require "debug") "app:actions:groupsActions"

module.exports = (db, mqttSocket) ->
	{ enrich } = (require "../helpers/enrichAppsForMqtt") db

	publishGroupsForDevice = (deviceId) ->
		query   = deviceId: deviceId
		topic   = "devices/#{deviceId}/groups"
		options = retain: true
		groups  = JSON.stringify (await db
			.DeviceGroup
			.findOne query
			.select "groups"
			.lean()
		).groups

		promisify (mqttSocket.publish.bind mqttSocket) topic, groups, options

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
		current           = await db.DeviceGroup.findOne(query).lean()
		currentGroups     = current?.groups or ["default"]
		newGroups         = without currentGroups, payload

		await db.DeviceGroup.findOneAndUpdate query, groups: newGroups
		await publishGroupsForDevice dest

		cb()

	removeGroup = ({ payload: label }, cb) ->
		devices = await db
			.DeviceGroup
			.find groups: label
			.lean()

		await Promise.all devices.map (device) ->
			query  = deviceId: device.deviceId
			update = groups: without device.groups, label

			Promise.all [
				db.DeviceGroup.findOneAndUpdate query, update
				publishGroupsForDevice device.deviceId
			]

		await db.Group.findOneAndRemove { label }

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

		current       = await db.DeviceGroup.findOne(query).select("groups").lean()
		currentGroups = current?.groups or ["default"]
		update        = groups: uniq compact [currentGroups..., payload...]

		await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
		await publishGroupsForDevice dest

		cb()

	return {
		createGroup
		removeGroup
		removeDeviceGroup
		publishGroups
		storeGroups
	}
