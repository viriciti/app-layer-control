debug               = require("debug") "app:sources:DevicesState"
createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/state"
			.map ({ topic, message, match }) ->
				try
					deviceId: match.id
					data:     JSON.parse message
				catch
					debug "Unprocessable state passed: #{message or '(empty)'}"
					{}

	topic: "devices/+/state"
