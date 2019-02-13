{ fromJS } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/groups"
			.filter ({ match }) ->
				match.id
			.map ({ topic, message, match }) ->
				fromJS
					deviceId: match.id
					key:      "groups"
					value:    JSON.parse message

	topic: "devices/+/groups"
