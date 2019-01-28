debug                                           = (require "debug") "app:api:administration"
filter                                          = require "p-filter"
{ Router }                                      = require "express"
{ without, isArray, uniq, compact, first, map } = require "lodash"

Store                  = require "../../Store"
getRegistryImages      = require "../../lib/getRegistryImages"
populateMqttWithGroups = require "../../helpers/populateMqttWithGroups"
prependRegistryUrl     = require "../../helpers/prependRegistryUrl"

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

isRegistryImageDependentOn = (image, configurations) ->
	configurations
		.map (configuration) ->
			configuration.get "fromImage"
		.valueSeq()
		.toArray()
		.includes image

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
# Supported operations are "store" and "remove"
# NOTE: Move to a separate endpoint?
router.patch "/group/:label/devices", ({ app, params, body }, res) ->
	{ db, mqtt }                  = app.locals
	{ operation, groups, target } = body
	target                        = [target] unless isArray target

	if operation is "remove"
		message = "Removing #{groups.length} group(s) for #{target.length} device(s) ..."

		debug message

		Promise.all target.map (deviceId) ->
			query             = deviceId: deviceId
			current           = await db.DeviceGroup.findOne(query).lean()
			currentGroups     = current?.groups or ["default"]
			newGroups         = without currentGroups, ...groups

			await db.DeviceGroup.findOneAndUpdate query, groups: newGroups
			await publishGroupsForDevice { db, mqtt, deviceId }

		res
			.status 200
			.json
				status:  "success"
				message: message
	else if operation is "store"
		message = "Storing #{groups.length} group(s) for #{target.length} device(s) ..."

		debug message

		Promise.all target.map (deviceId) ->
			query         = deviceId: deviceId
			current       = await db.DeviceGroup.findOne(query).select("groups").lean()
			currentGroups = current?.groups or ["default"]
			update        = groups: uniq compact [currentGroups..., groups...]

			await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
			await publishGroupsForDevice { db, mqtt, deviceId }

		res
			.status 200
			.json
				status:  "message"
				message: message

# Registry Images
router.post "/registry", ({ app, params, body }, res) ->
	{ db }   = app.locals
	{ name } = body

	try
		await db.AllowedImage.create { name }

		images               = await getRegistryImages [name]
		{ versions, access } = first Object.values images

		await db.RegistryImages.create
			access:   access
			name:     prependRegistryUrl name
			versions: versions

		res
			.status 200
			.json
				status:  "success"
				message: "Registry image added"
	catch error
		if error.code is 11000
			res
				.status 409
				.json
					status:  "error"
					message: "This registry image is already added"
		else
			res
				.status 500
				.json
					status:  "error"
					message: error.message

router.delete "/registry/:name", ({ app, params, body }, res) ->
	{ db }    = app.locals
	{ name }  = params
	{ image } = body

	try
		configurations = await store.getConfigurations()

		if isRegistryImageDependentOn image, configurations
			return res
				.status 409
				.json
					status:  "error"
					message: "One or more configurations depend on this registry image"

		await Promise.all [
			db.AllowedImage.findOneAndRemove { name }
			db.RegistryImages.findOneAndRemove name: image
		]

		res
			.status 200
			.json
				status:  "success"
				message: "Registry image removed"
	catch error
		res
			.status 500
			.json
				status:  "error"
				message: error.message

router.get "/registry", ({ app }, res) ->
	{ db } = app.locals

	try
		images = await db
			.AllowedImage
			.find {}
			.select "name"
			.lean()
		names  = map images, "name"
		images = await getRegistryImages names

		store.storeRegistryImages images

		res
			.status 200
			.json
				status: "success"
				data:   images: images
	catch error
		res
			.status 500
			.json
				status: "error"
				data:   error.message

# storeRegistryImages = ({ payload: images }) ->
# 	store.storeRegistryImages images

# refreshRegistryImages = ({ payload }) ->
# 	images = await db
# 		.AllowedImage
# 		.find {}
# 		.select "name"
# 		.lean()
# 	names  = map images, "name"
# 	images = await getRegistryImages names

# 	storeRegistryImages payload: images

module.exports = router
