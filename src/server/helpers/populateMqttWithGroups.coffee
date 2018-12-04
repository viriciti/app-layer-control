module.exports = (db, mqttSocket, cb) ->
	{ publishGroups } = (require "../actions/groupsActions") db, mqttSocket

	publishGroups cb
