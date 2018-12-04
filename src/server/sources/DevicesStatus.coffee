createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, /devices\/(.+)\/status/
			.filter ({ topic }) ->
				not not topic.split("/")[1]
			.map ({ topic, message }) ->
				deviceId = topic.split("/")[1]
				status   = message.toString()

				{ deviceId, status }

	topic: "devices/+/status"
