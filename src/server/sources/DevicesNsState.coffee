{ Observable } = require "rxjs"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/nsState/+key"
			.map ({ topic, message, match }) ->
				deviceId: match.id
				key:      match.key
				value:    JSON.parse message.toString()
			.filter ({ deviceId }) ->
				deviceId
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/nsState/+"
