randomstring = require "randomstring"
config       = require "config"

module.exports = (client) ->
	(action, cb) ->
		# ensure interval and listeners are cleaned up correctly
		callback = cb
		cb       = (error, result) ->
			clearInterval timeoutInterval
			timeoutInterval = null
			error           = message: error.message if error instanceof Error

			client.unsubscribe subscribeTopic
			client.removeListener "message", onMessage

			callback error, result

		onMessage = (topic, payload) ->
			return unless topic is subscribeTopic

			payload              = JSON.parse payload.toString()
			{ statusCode, data } = payload

			if statusCode is "OK"
				cb null, { data }
			else
				cb { data }

		onTimeout = ->
			clearInterval timeoutInterval
			timeoutInterval = null

			cb message: "Socket timed out"

		timeoutInterval = null
		actionId        = randomstring.generate()
		origin          = config.mqtt.clientId
		publishTopic    = "commands/#{action.dest}/#{actionId}"
		subscribeTopic  = "commands/#{origin}/#{actionId}/response"
		message         = JSON.stringify
			origin:  origin
			action:  action.action
			payload: action.payload

		client.on "message", onMessage

		client.subscribe subscribeTopic
		client.publish   publishTopic, message, (error) ->
			return cb message: error.message if error

			timeoutInterval = setInterval onTimeout, config.responseTimeout
