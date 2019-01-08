randomstring = require "randomstring"
config       = require "config"

module.exports = (client) ->
	(action, cb) ->
		# ensure timeout and listeners are cleaned up correctly
		timeout  = null
		callback = cb
		cb       = (error, result) ->
			clearTimeout timeout
			timeout = null
			error   = message: error.message if error instanceof Error

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
			clearTimeout timeout
			timeout = null

			cb message: "Socket timed out"

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

			timeout = setTimeout onTimeout, config.mqtt.responseTimeout
