debug          = (require "debug") "app: sources:DevicesState"
{ Observable } = require "rxjs"
{ fromJS }     = require "immutable"

module.exports =
	observable: (socket) ->
		Observable
			.fromEvent socket, "devices/*/state"
			.map (raw) ->
				try
					JSON.parse raw
				catch
					debug "Unprocessable state passed: #{raw or '(empty)'}"
					{}
			.filter (data) ->
				data?.deviceId?
			.map (state) ->
				fromJS state
			.takeUntil Observable.fromEvent socket, "disconnected"

	topic: "devices/+/state"
