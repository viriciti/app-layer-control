debug          = (require "debug") "app: sources:DevicesState"
{ Observable } = require "rxjs"
{ fromJS }     = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, /devices\/.+\/state/
			.map ({ message }) ->
				try
					JSON.parse message
				catch
					debug "Unprocessable state passed: #{message or '(empty)'}"
					{}
			.filter (data) ->
				data?.deviceId?
			.map (state) ->
				fromJS state
			.takeUntil Observable.fromEvent socket, "close"

	topic: "devices/+/state"
