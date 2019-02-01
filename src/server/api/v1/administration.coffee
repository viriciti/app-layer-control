debug                                           = (require "debug") "app:api:administration"
filter                                          = require "p-filter"
{ Router }                                      = require "express"
{ without, isArray, uniq, compact, first, map } = require "lodash"

log                    = (require "../../lib/Logger") "administration"
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
router.get "/applications", ({ app }, res, next) ->
	try
		res
			.status 200
			.json
				status: "success"
				data:   await store.getConfigurations()
	catch error
		next error

router.put "/application/:name", ({ app, params, body }, res, next) ->
	{ db, mqtt } = app.locals
	{ name }     = params
	query        = applicationName: name

	try
		body   = { ...body, applicationName: name }
		exists = await db
			.Configuration
			.find query
			.countDocuments()

		if exists
			await db.Configuration.findOneAndUpdate query, body
		else
			await db.Configuration.create body

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
		next error

router.delete "/application/:name", ({ app, params }, res, next) ->
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

		await db.Configuration.deleteMany applicationName: name

		res
			.status 204
			.end()
	catch error
		next error

# Sources
router.get "/sources", ({ app }, res, next) ->
	try
		res
			.status 200
			.json
				status: "success"
				data:   await store.getDeviceSources()
	catch error
		next error

router.put "/source/:name", ({ app, params, body }, res, next) ->
	{ db }   = app.locals
	{ name } = params
	query    = name: name
	update   = { ...body, name: name }

	try
		exists = await db
			.DeviceSource
			.find query
			.countDocuments()

		if exists
			await db.DeviceSource.findOneAndUpdate query, update
		else
			await db.DeviceSource.create update

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
		next error

router.delete "/source/:name", ({ app, params }, res, next) ->
	{ db }   = app.locals
	{ name } = params

	try
		await db.DeviceSource.deleteMany headerName: name

		res
			.status 204
			.end()
	catch error
		next error

# Groups
router.get "/groups", ({ app }, res, next) ->
	try
		res
			.status 200
			.json
				status: "success"
				data:   await store.getGroups()
	catch error
		next error

router.put "/group/:label", ({ app, params, body }, res, next) ->
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
			await db.Group.create
				label:        label
				applications: body.applications

		populateMqttWithGroups db, mqtt

		res
			.status 200
			.json
				status:  "success"
				message: "Group #{if exists then "updated" else "created"}"
	catch error
		next error

router.delete "/group/:label", ({ app, params, body }, res, next) ->
	{ db, mqtt } = app.locals
	{ label }    = params

	try
		devices = await db
			.DeviceGroup
			.find groups: label
			.lean()

		await db.Group.findOneAndRemove { label }

		await Promise.all devices.map (device) ->
			{ deviceId } = device
			query        = deviceId: deviceId
			update       = groups: without device.groups, label

			await db.DeviceGroup.findOneAndUpdate query, update
			await publishGroupsForDevice { db, mqtt, deviceId }

		populateMqttWithGroups db, mqtt

		res
			.status 204
			.end()
	catch error
		next error

# Device Groups
# Supported operations are "store" and "remove"
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
			update        = groups: uniq compact [...currentGroups, ...groups]

			await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
			await publishGroupsForDevice { db, mqtt, deviceId }

		res
			.status 200
			.json
				status:  "message"
				message: message

# Registry Images
router.post "/registry", ({ app, params, body }, res, next) ->
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
		return next error unless error.code is 11000

		res
			.status 409
			.json
				status:  "error"
				message: "This registry image is already added"

router.delete "/registry/:name", ({ app, params, body }, res, next) ->
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
			.status 204
			.end()
	catch error
		next error

router.get "/registry", ({ app }, res, next) ->
	{ db } = app.locals

	try
		images = await db
			.AllowedImage
			.find()
			.select "name"
			.lean()
		names  = map images, "name"
		images = await getRegistryImages names

		store.storeRegistryImages images

		res
			.status 200
			.json
				status: "success"
				data:   images
	catch error
		next error

# Error middleware
router.use (error, req, res, next) ->
	log.error error.stack

	res.sendStatus 500

module.exports = router
