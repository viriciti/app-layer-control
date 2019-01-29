{ Router } = require "express"


module.exports = (getDeviceStates) ->
	router = Router()

	router.get "/", (_, res) ->
		res
			.status 200
			.json
				status: "success"
				data:    getDeviceStates().toJS()

	router
