{ Router } = require "express"
{ pick }   = require "lodash"

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
					.populate "groups"
	catch error
		next error

module.exports = router
