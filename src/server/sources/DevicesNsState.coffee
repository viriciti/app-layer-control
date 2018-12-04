{ Observable } = require "rxjs"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, /devices\/.+\/nsState\/.+/
			.map ({ topic, message }) ->
				deviceId: topic.split("/")[1]
				key:      topic.split("/")[3]
				value:    JSON.parse message.toString()
			.filter ({ deviceId }) ->
				deviceId
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/nsState/+"
