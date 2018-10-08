{ Observable } = require "rxjs"

enhancedFromEvent$ = require "../lib/enhancedFromEvent"

topic = "devices/*/appState/*/*"

module.exports =
	observable: (socket) ->
		enhancedFromEvent$ socket, topic
			.map ({ message, namespaces }) ->
				deviceId = namespaces[1]
				name     = namespaces[3]
				action   = namespaces[4]

				action:   action
				data:     JSON.parse message
				deviceId: deviceId
				name:     name
			.filter ({ deviceId }) ->
				deviceId and deviceId isnt "undefined"
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/appState/+/+"
