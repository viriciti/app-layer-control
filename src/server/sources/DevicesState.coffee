debug      = (require "debug") "app:sources:DevicesState"
{ fromJS } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, /devices\/.+\/state/
			.map ({ topic, message }) ->
				try
					JSON.parse message
				catch
					debug "Unprocessable state passed: #{message or '(empty)'}"
					{}
			.filter (data) ->
				data?.deviceId?
			.map (state) ->
				fromJS state

	topic: "devices/+/state"
