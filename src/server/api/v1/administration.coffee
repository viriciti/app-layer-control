filter               = require "p-filter"
{ Router }           = require "express"
{ without, isArray } = require "lodash"
debug                = (require "debug") "app:api:administration"

populateMqttWithGroups = require "../../helpers/populateMqttWithGroups"
Store                  = require "../../Store"

router = Router()
store  = new Store

getDependents = (groups, applicationName) ->
	groups
		.entrySeq()
		.filter ([_, applications]) ->
			applicationName in applications.keySeq().toArray()
		.map ([name]) ->
			name
		.toArray()

publishGroupsForDevice = ({ mqtt, db, deviceId }) ->
	query   = deviceId: deviceId
	topic   = "devices/#{deviceId}/groups"
	options = retain: true
	groups  = JSON.stringify (await db
		.DeviceGroup
		.findOne query
		.select "groups"
		.lean()
	).groups

	mqtt.publish topic, groups, options

# Application
router.put "/application/:name", ({ app, params, body }, res) ->
	{ db, mqtt } = app.locals
	{ name }     = params
	query        = applicationName: name

	try
		body   = { ...body, applicationName: name }
		exists = 0 isnt await db
			.Configuration
			.find query
			.countDocuments()

		await db.Configuration.create body unless exists
		await db.Configuration.findOneAndUpdate query, body
		await populateMqttWithGroups db, mqtt

		res
			.status 200
			.json
				status:  "success"
				message: "Application was succesfully #{if exists then "updated" else "created"}"
				data:    await db
					.Configuration
					.findOne query
					.select "-_id -__v"
					.lean()
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

router.delete "/application/:name", ({ app, params }, res) ->
	{ db }   = app.locals
	{ name } = params

	try
		groups     = await store.getGroups()
		dependents = getDependents groups, name

		if dependents.length
			return res
				.status 409
				.json
					status:  "error"
					message: "One or more groups depend on this configuration"
					data:    dependents: dependents

		await db.Configuration.remove applicationName: name

		res
			.status 204
			.end()
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

# Sources
router.put "/source/:name", ({ app, params, body }, res) ->
	{ db }   = app.locals
	{ name } = params
	query    = name: name
	update   = { ...body, name: name }

	try
		exists = not not (await db
			.DeviceSource
			.find query
			.lean()
		).length

		await db.DeviceSource.create update unless exists
		await db.DeviceSource.findOneAndUpdate query, update

		res
			.status 200
			.json
				status:  "success"
				message: "Source was succesfully #{if exists then "updated" else "created"}"
				data:    await db
					.DeviceSource
					.findOne query
					.select "-_id -__v"
					.lean()
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

router.delete "/source/:name", ({ app, params }, res) ->
	{ db }   = app.locals
	{ name } = params

	try
		await db.DeviceSource.remove headerName: name

		res
			.status 204
			.end()
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

# Groups
router.put "/group/:label", ({ app, params, body }, res) ->
	{ db, mqtt } = app.locals
	{ label }    = params
	applications = Object.keys body.applications

	try
		unless label is "default"
			defaultGroup = await db.Group.find label: "default"
			exists       = not not defaultGroup.length

			unless exists
				return res
					.status 409
					.json
						status:  "error"
						message: "The default group must be configured before you can configure other groups"

		missing = await filter applications, (name) ->
			0 is await db
				.Configuration
				.find applicationName: name
				.countDocuments()

		if missing.length
			return res
				.status 409
				.json
					status:  "error"
					message: "One or more application(s) do not exist"
					data:    missing: missing

		exists = await db
			.Group
			.find label: label
			.countDocuments()

		if exists
			await db.Group.findOneAndUpdate { label }, body
		else
			await db.Group.create { ...body, label: label }

		await populateMqttWithGroups db, mqtt

		res
			.status 200
			.json
				status:  "success"
				message: "Group #{if exists then "updated" else "created"}"
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

router.delete "/group/:label", ({ app, params, body }, res) ->
	{ db, mqtt } = app.locals
	{ label }    = params

	try
		devices = await db
			.DeviceGroup
			.find groups: label
			.lean()

		await Promise.all devices.map (device) ->
			{ deviceId } = device
			query        = deviceId: deviceId
			update       = groups: without device.groups, label

			await db.DeviceGroup.findOneAndUpdate query, update
			await publishGroupsForDevice { db, mqtt, deviceId }

		await db.Group.findOneAndRemove { label }
		await populateMqttWithGroups db, mqtt

		res
			.status 204
			.end()
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

# Device Groups
# Supported types are "store" and "remove"
# NOTE: Move to a separate endpoint?
router.patch "/group/:label/devices", ({ app, params, body }) ->
	{ db, mqtt }             = app.locals
	{ type, groups, target } = body
	target                 = [target] unless isArray target

	if type is "remove"
		debug "Removing #{groups.length} group(s) for #{target.length} device(s)"

		Promise.all target.map (deviceId) ->
			query             = deviceId: deviceId
			current           = await db.DeviceGroup.findOne(query).lean()
			currentGroups     = current?.groups or ["default"]
			newGroups         = without currentGroups, groups

			await db.DeviceGroup.findOneAndUpdate query, groups: newGroups
			await publishGroupsForDevice { db, mqtt, deviceId }

		res
			.status 401
	else if type is "store"
		debug "Storing #{payload.length} group(s) for #{dest.length} device(s)"

		Promise.all dest.map (deviceId) ->
			query         = deviceId: deviceId
			current       = await db.DeviceGroup.findOne(query).select("groups").lean()
			currentGroups = current?.groups or ["default"]
			update        = groups: uniq compact [currentGroups..., payload...]

			await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
			await publishGroupsForDevice deviceId

module.exports = router
