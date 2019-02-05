{ Router } = require "express"


module.exports = (getDeviceStates) ->
	router = Router()

	router.get "/", (_, res) ->
		res
			.status 200
			.json
				status: "success"
				data:    getDeviceStates().toJS()

	router.put "/:id/state", ({ app, params }, res, next) ->
		{ rpc } = app.locals
		{ id }  = params
		topic   = "actions/#{id}/refreshState"

		try
			await rpc.call topic

			res
				.status 200
				.json
					status:  "success"
					message: "Request sent"
		catch error
			return next error unless error.message.match /communication timeout/i

			res
				.status 504
				.json
					status:  "error"
					message: "Communication timeout"
					data:    deviceId: id

	router
