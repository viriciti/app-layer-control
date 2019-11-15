{ fromJS } = require "immutable"

createTopicListener = require "../helpers/createTopicListener"

module.exports = (socket) ->
	createTopicListener socket, "devices/+id/#"
		.filter ({ retained }) ->
			not retained
		.map ({ match }) ->
			fromJS
				deviceId:     match.id
				lastActivity: Date.now()
