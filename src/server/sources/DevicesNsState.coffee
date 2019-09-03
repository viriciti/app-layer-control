{ fromJS } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/nsState/+key"
			.filter ({ match }) ->
				match.id
			.map ({ topic, message, match }) ->
				fromJS
					deviceId: match.id
					data:     [match.key]: JSON.parse message

	topic: "devices/+/nsState/+"
