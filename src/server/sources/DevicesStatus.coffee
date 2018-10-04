{ Observable } = require "rxjs"

topic = "devices/*/status"

module.exports =
	observable: (socket) ->
		Observable
			.create (observer) ->
				_onDevicesStatus = (status) ->
					deviceId = (@event.split "/")[1]
					return if not deviceId or deviceId is "undefined"

					observer.next { deviceId, status }

				socket.on topic, _onDevicesStatus

				socket.once "disconnected", ->
					socket.removeListener topic, _onDevicesStatus
					observer.complete()

	topic: "devices/+/status"
