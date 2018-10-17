log = (require "../lib/Logger") "helpers"

module.exports = (db, mqttSocket, cb) ->
	{ publishGroups } = (require "../actions/groupsActions") db, mqttSocket

	publishGroups (error) ->
		return log.error error.message if error
		log.info "Populated mqtt with groups"
		cb? error
