{ Observable } = require "rxjs"

topic = "devices/*/logs"

module.exports =
	observable: (socket) ->
		Observable
			.create (observer) ->
				_onDevicesLogs = (logs) ->
					return observer.next() if not logs

					logs = JSON.parse logs
					deviceId = (@event.split "/")[1]
					observer.next { logs, deviceId }

				socket.on topic, _onDevicesLogs

				socket.once "disconnected", ->
					socket.removeListener topic, _onDevicesLogs
					observer.complete()

			.filter (logs) -> logs
			.throttleTime 1000
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/logs"
