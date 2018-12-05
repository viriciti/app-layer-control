createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/status"
			.map ({ match, message }) ->
				deviceId = match.id
				status   = message.toString()

				{ deviceId, status }

	topic: "devices/+/status"
