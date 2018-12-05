debug      = (require "debug") "app:sources:DevicesState"
{ fromJS } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/state"
			.map ({ topic, message, match }) ->
				try
					deviceId: match.id
					data:     JSON.parse message
				catch
					debug "Unprocessable state passed: #{message or '(empty)'}"
					{}
			.filter ({ deviceId, data }) ->
				return true if deviceId is data.deviceId

				throw new Error "Topic ID did not match payload ID (topic: #{deviceId}, payload: #{data.deviceId})"
			.map ({ data }) ->
				data
			.map (state) ->
				fromJS state

	topic: "devices/+/state"
