{ Router } = require "express"
{ pick }   = require "lodash"

router = Router()

router.get "/", ({ app }, res, next) ->
	{ db } = app.locals
	data   = await db.DeviceState.find().populate "groups"
	data   = data.reduce (devices, device) ->
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

module.exports = router
