{ Router } = require "express"

router = Router()

router.get "/", ({ app }, res, next) ->
	{ db } = app.locals

	try
		res
			.status 200
			.json
				status: "success"
				data:   await db
					.DeviceState
					.find()
					.immutable()
	catch error
		next error

module.exports = router
