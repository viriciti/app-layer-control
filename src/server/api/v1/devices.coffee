{ Router } = require "express"
{ pick }   = require "lodash"

router = Router()

router.get "/", ({ app, query }, res, next) ->
	{ db } = app.locals
	data   = await db
		.DeviceState
		.find()
		.select unless query.all is "1" then "-containers -images" 
		.populate "groups"
	data = data.reduce (devices, device) ->
		devices[device.deviceId] = device
		devices
	, {}

	try
		res
			.status 200
			.json
				status: "success"
				data:   data
	catch error
		next error

router.get "/:id", ({ app, params }, res, next) ->
	{ db } = app.locals

	try
		device = await db
			.DeviceState
			.findOne deviceId: params.id
			.populate "groups"

		unless device
			return res
				.status 404
				.json
					status: "error"
					data:   "Device '#{params.id}' not found"

		res
			.status 200
			.json
				status: "success"
				data:   device
	catch error
		next error

module.exports = router
