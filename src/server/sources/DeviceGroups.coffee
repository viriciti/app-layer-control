{ Observable } = require "rxjs"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/groups"
			.map ({ topic, message, match }) ->
				deviceId: match.id
				key:      "groups"
				value:    JSON.parse message
			.filter ({ deviceId }) ->
				deviceId
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/groups"
