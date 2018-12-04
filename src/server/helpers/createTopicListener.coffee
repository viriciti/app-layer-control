{ Observable } = require "rxjs"

module.exports = (socket, matcher) ->
	Observable.create (observer) ->
		onMessage = (topic, message) ->
			return unless topic.match matcher

			observer.next { topic, message }

		onClose = ->
			socket.removeListener "message", onMessage
			observer.complete()

		socket
			.on "message", onMessage
			.on "close",   onClose
