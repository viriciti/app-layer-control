{ Observable } = require "rxjs"

module.exports = (socket, eventName) ->
	throw new Error "I need a socket and an eventName" unless socket and eventName

	Observable.create (observer) ->
		eventHandler = (message) ->
			namespaces = @event.split "/"
			observer.next { message, namespaces }

		errorHandler = (error) ->
			observer.error error

		socket
			.on eventName, eventHandler
			.on "error", errorHandler
			.once "disconnected", ->
				socket.removeListener eventName, eventHandler
				socket.removeListener "error",   errorHandler
				observer.complete()
