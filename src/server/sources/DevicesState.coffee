debug          = (require "debug") "app: sources:DevicesState"
{ Observable } = require "rxjs"
{ fromJS }     = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, /devices\/.+\/state/
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
			.takeUntil Observable.fromEvent socket, "close"

	topic: "devices/+/state"
