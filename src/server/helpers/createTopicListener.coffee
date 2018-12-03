{ Observable } = require "rxjs"

module.exports = (socket, listenForTopic) ->
	Observable.create (observer) ->
		onMessage = (topic, message) ->
			return unless topic.match listenForTopic

			observer.next message

		onClose = ->
			socket.removeListener "message", onMessage

		socket
			.on "message", onMessage
			.on "close",   onClose
