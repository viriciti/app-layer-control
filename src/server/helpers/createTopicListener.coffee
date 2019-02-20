{ Observable } = require "rxjs"
MQTTPattern    = require "mqtt-pattern"

module.exports = (socket, matcher) ->
	Observable.create (observer) ->
		onMessage = ({ topic, payload, retain, cmd }) ->
			return unless topic
			return unless cmd is "publish"
			return unless MQTTPattern.matches matcher, topic

			observer.next
				match:    MQTTPattern.exec matcher, topic
				message:  payload.toString()
				retained: retain
				topic:    topic

		onClose = ->
			socket.removeListener "message", onMessage
			observer.complete()

		socket
			.on   "packetreceive", onMessage
			.once "close",         onClose
