debug           = (require "debug") "app:sources:DevicesState"
{ fromJS, Map } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports =
	observable: (socket) ->
		createTopicListener socket, "devices/+id/state"
			.map ({ topic, message, match }) ->
				try
					fromJS
						deviceId: match.id
						data:     JSON.parse message
				catch
					debug "Unprocessable state passed: #{message or '(empty)'}"
					Map()

	topic: "devices/+/state"
