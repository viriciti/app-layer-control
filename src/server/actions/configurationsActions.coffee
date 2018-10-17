debug = (require "debug") "app:actions:configuration"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

module.exports = (db, mqttSocket) ->
	createConfiguration = ({ payload }, cb) ->
		{ key, value } = payload

		debug "Configuration create", key, payload

		db.Configuration.findOneAndUpdate { applicationName: key },
			value,
			{ upsert: true },
			(error, doc) ->
				return cb error if error

				debug "Configuration saved", key, doc

				populateMqttWithGroups db, mqttSocket, (error) ->
					return cb error if error
					cb null, "Configuration #{key} created correctly!"


	removeConfiguration = ({ payload: configName }, cb) ->
		db.Configuration.findOneAndRemove { applicationName: configName }, (error) ->
			return cb error if error
			cb null, "Configuration #{configName} removed correctly!"


	return {
		createConfiguration,
		removeConfiguration
	}
