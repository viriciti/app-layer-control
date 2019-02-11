{ Map } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/status"
			.map ({ match, message, retained }) ->
				deviceId = match.id
				status   = message

				Map
					deviceId: deviceId
					status:   status
					retained: retained

	topic: "devices/+/status"
