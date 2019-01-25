{ Router } = require "express"

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

# Application
router.put "/application", ({ app, body }, res) ->
	{ db, mqtt }        = app.locals
	{ applicationName } = body
	query               = applicationName: applicationName

	try
		exists = not not (await db
			.Configuration
			.find query
			.lean()
		).length

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

module.exports = router
