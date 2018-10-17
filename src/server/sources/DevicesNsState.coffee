{ Observable } = require "rxjs"

enhancedFromEvent$ = require "../lib/enhancedFromEvent"

topic = "devices/*/nsState/*"

module.exports =
	observable: (socket) ->
		enhancedFromEvent$ socket, topic
			.map ({ message, namespaces }) ->
				val:      JSON.parse message
				deviceId: namespaces[1]
				key:      namespaces[3]
			.filter ({ deviceId }) ->
				deviceId and deviceId isnt "undefined"
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/nsState/+"
