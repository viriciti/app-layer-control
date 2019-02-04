debug                   = (require "debug") "app:api"
filter                  = require "p-filter"
{ Router }              = require "express"
{ isArray, first, map } = require "lodash"

log                    = (require "../../lib/Logger") "administration"
Store                  = require "../../Store"
getRegistryImages      = require "../../lib/getRegistryImages"
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
	{ db, broadcastApplications } = app.locals
	{ name }                      = params
	query                         = applicationName: name

	try
		body = { ...body, applicationName: name }
		doc  = await db.Configuration.findOneAndUpdate query, body,
			upsert:              true
			setDefaultsOnInsert: true

		broadcastApplications()

		res
			.status 200
			.json
				status:  "success"
				message: "Application was succesfully #{if doc? then "updated" else "created"}"
				data:    await db
					.Configuration
					.findOne query
					.select "-_id -__v"
					.lean()
	catch error
		next error

router.delete "/application/:name", ({ app, params }, res, next) ->
	{ db, broadcastApplications } = app.locals
	{ name }                      = params

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

		broadcastApplications()

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
	{ db, broadcastSources } = app.locals
	{ name }                 = params
	query                    = name           : name
	update                   = { ...body, name: name }

	try
		doc = await db.DeviceSource.findOneAndUpdate query, update,
			upsert:              true
			setDefaultsOnInsert: true

		broadcastSources()

		res
			.status 200
			.json
				status:  "success"
				message: "Source was succesfully #{if doc? then "updated" else "created"}"
				data:    await db
					.DeviceSource
					.findOne query
					.select "-_id -__v"
					.lean()
	catch error
		next error

router.delete "/source/:name", ({ app, params }, res, next) ->
	{ db, broadcastSources } = app.locals
	{ name }                 = params

	try
		await db.DeviceSource.deleteMany headerName: name

		broadcastSources()

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
	{ db, broadcastGroups } = app.locals
	{ label }               = params
	applications            = Object.keys body.applications

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

		query  = label: label
		update = label: label, applications: body.applications
		doc    = await db.Group.findOneAndUpdate query, update,
			upsert:              true
			setDefaultsOnInsert: true

		broadcastGroups()

		res
			.status 200
			.json
				status:  "success"
				message: "Group #{if doc? then "updated" else "created"}"
	catch error
		next error

router.delete "/group/:label", ({ app, params, body }, res, next) ->
	{ db, broadcastGroups } = app.locals
	{ label }               = params

	try
		query         = groups: label
		update        = $pull:  groups: label
		{ nModified } = await db.DeviceGroup.updateMany query, update
		debug "Removed group #{label} for #{nModified} device(s)"

		await db.Group.findOneAndDelete { label }
		debug "Removed group #{label}"

		broadcastGroups()

		res
			.status 204
			.end()
	catch error
		next error

# Device Groups
# Supported operations are "store" and "remove"
router.post "/group/devices", ({ app, body }, res) ->
	{ db }                        = app.locals
	{ operation, groups, target } = body
	target                        = [target] unless isArray target

	if operation is "remove"
		query   = deviceId: $in: target
		update  = $pullAll: groups: groups

		{ nModified } = await db.DeviceGroup.updateMany query, update
		message       = "Removed groups #{groups.join ', '} for #{nModified} device(s)"

		debug message

		res
			.status 200
			.json
				status:  "success"
				message: message
	else if operation is "store"
		query   = deviceId: $in: target
		update  = $addToSet: groups: $each: groups
		options =
			upsert:              true
			setDefaultsOnInsert: true

		{ nModified } = await db.DeviceGroup.updateMany query, update, options
		message       = "Added groups #{groups.join ', '} to #{nModified} device(s)"

		debug message

		res
			.status 200
			.json
				status:  "message"
				message: message

# Registry Images
router.post "/registry", ({ app, params, body }, res, next) ->
	{ db, broadcastRegistry } = app.locals
	{ name }                  = body

	try
		await db.AllowedImage.create name: name

		images               = await getRegistryImages [name]
		{ versions, access } = first Object.values images

		await db.RegistryImages.create
			access:   access
			name:     prependRegistryUrl name
			versions: versions

		broadcastRegistry()

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
	{ db, broadcastRegistry } = app.locals
	{ name }                  = params
	{ image }                 = body

	try
		if isRegistryImageDependentOn image, await store.getConfigurations()
			return res
				.status 409
				.json
					status:  "error"
					message: "One or more configurations depend on this registry image"

		await Promise.all [
			db.AllowedImage.findOneAndDelete { name }
			db.RegistryImages.findOneAndDelete name: image
		]

		broadcastRegistry()

		res
			.status 204
			.end()
	catch error
		next error

router.get "/registry", ({ app }, res, next) ->
	{ db, broadcastRegistry } = app.locals

	try
		images = await db
			.AllowedImage
			.find()
			.select "name"
			.lean()
		names  = map images, "name"
		images = await getRegistryImages names

		store.storeRegistryImages images

		broadcastRegistry()

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
