createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/logs"
			.filter ({ message }) ->
				message?.toString().trim().length
			.map ({ match, message }) ->
				deviceId: match.id
				logs:     JSON.parse message
			.throttleTime 1000

	topic: "devices/+/logs"
