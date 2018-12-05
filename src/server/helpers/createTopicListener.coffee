{ Observable } = require "rxjs"
MQTTPattern    = require "mqtt-pattern"

module.exports = (socket, matcher) ->
	Observable.create (observer) ->
		onMessage = (topic, message) ->
			return unless MQTTPattern.matches matcher, topic

			observer.next
				topic:   topic
				message: message
				match:   MQTTPattern.exec matcher, topic

		onClose = ->
			socket.removeListener "message", onMessage
			observer.complete()

		socket
			.on "message", onMessage
			.on "close",   onClose
