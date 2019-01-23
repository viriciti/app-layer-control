async                               = require "async"
config                              = require "config"
{ compact, uniq, without, isArray } = require "lodash"
{ promisify }                       = require "util"
debug                               = (require "debug") "app:actions:groupsActions"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

module.exports = (db, mqttSocket) ->
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

		promisify(mqttSocket.publish.bind mqttSocket) topic, groups, options

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

	removeDeviceGroup = ({ payload }) ->
		{ payload, dest } = payload
		dest              = [dest] unless isArray dest

		debug "Removing #{payload.length} group(s) for #{dest.length} device(s)"

		await Promise.all dest.map (deviceId) ->
			query             = deviceId: deviceId
			current           = await db.DeviceGroup.findOne(query).lean()
			currentGroups     = current?.groups or ["default"]
			newGroups         = without currentGroups, payload

			await db.DeviceGroup.findOneAndUpdate query, groups: newGroups
			await publishGroupsForDevice deviceId

	removeGroup = ({ payload: label }) ->
		devices = await db
			.DeviceGroup
			.find groups: label
			.lean()

		await Promise.all devices.map (device) ->
			{ deviceId } = device
			query        = deviceId: deviceId
			update       = groups: without device.groups, label

			await db.DeviceGroup.findOneAndUpdate query, update
			await publishGroupsForDevice deviceId

		await db.Group.findOneAndRemove { label }

		populateMqttWithGroups db, mqttSocket

	publishGroups = ->
		populateMqttWithGroups db, mqttSocket

	storeGroups = ({ payload }) ->
		{ payload, dest } = payload
		dest              = [dest] unless isArray dest

		debug "Storing #{payload.length} group(s) for #{dest.length} device(s)"

		Promise.all dest.map (deviceId) ->
			query         = deviceId: deviceId
			current       = await db.DeviceGroup.findOne(query).select("groups").lean()
			currentGroups = current?.groups or ["default"]
			update        = groups: uniq compact [currentGroups..., payload...]

			await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
			await publishGroupsForDevice deviceId

	return {
		createGroup
		removeGroup
		removeDeviceGroup
		publishGroups
		storeGroups
	}
