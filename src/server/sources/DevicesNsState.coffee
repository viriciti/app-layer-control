createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/nsState/+key"
			.filter ({ match }) ->
				match.id
			.map ({ topic, message, match }) ->
				deviceId: match.id
				key:      match.key
				value:    JSON.parse message

	topic: "devices/+/nsState/+"
