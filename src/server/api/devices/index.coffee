{ Router } = require "express"

log = (require "../../lib/Logger") "api:devices"

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
					status:  "pending"
					message: "Request to refresh state sent"
		catch error
			next error

	router.get "/:id/logs/:name", ({ app, params }, res, next) ->
		{ rpc }      = app.locals
		{ id, name } = params
		topic        = "actions/#{id}/getContainerLogs"

		try
			res
				.status 200
				.json
					status:  "success"
					message: "Logs fetched"
					data:    await rpc.call topic, id: name
		catch error
			next error

	router.put "/:id/restart/:name", ({ app, params }, res, next) ->
		{ rpc }      = app.locals
		{ id, name } = params
		topic        = "actions/#{id}/restartContainer"

		try
			await rpc.call topic, id: name

			res
				.status 200
				.json
					status:  "pending"
					message: "Request to restart container '#{name}'' sent"
		catch error
			next error

	router.delete "/:id/:name", ({ app, params }, res, next) ->
		{ rpc }      = app.locals
		{ id, name } = params
		topic        = "actions/#{id}/removeContainer"

		try
			await rpc.call topic, id: name

			res
				.status 202
				.json
					status:  "pending"
					message: "Request to remove container '#{name}' sent"
		catch error
			next error

	router.use (error, req, res, next) ->
		if error.message.match /communication timeout/i
			res
				.status 504
				.json
					status:  "error"
					message: "Communication timeout"
		else
			log.error error.stack
			res.sendStatus 500

	router
