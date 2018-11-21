debug = (require "debug") "app:actions:configuration"

populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

isDependentOn = (groups, name) ->
	groups
		.valueSeq()
		.flatMap (application) ->
			application
				.keySeq()
				.toArray()
		.includes name

module.exports = (db, mqttSocket, store) ->
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
		store.getGroups (error, groups) ->
			return cb new Error "One or more groups depend on this configuration" if isDependentOn groups, configName

			db.Configuration.findOneAndRemove { applicationName: configName }, (error) ->
				return cb error if error
				cb null, "Configuration #{configName} removed correctly!"


	return {
		createConfiguration,
		removeConfiguration
	}
