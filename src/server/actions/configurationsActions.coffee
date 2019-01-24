populateMqttWithGroups = require "../helpers/populateMqttWithGroups"

isDependentOn = (groups, name) ->
	groups
		.valueSeq()
		.flatMap (application) ->
			application
				.keySeq()
				.toArray()
		.includes name

module.exports = (db, socket, store) ->
	createConfiguration = ({ payload }) ->
		{ key, value } = payload
		query          = applicationName: key

		await db.Configuration.findOneAndUpdate query, value, upsert: true
		await populateMqttWithGroups db, socket

	removeConfiguration = ({ payload: configName }) ->
		groups = await store.getGroups()
		return Promise.reject new Error "One or more groups depend on this configuration" if isDependentOn groups, configName

		await db.Configuration.findOneAndRemove applicationName: configName

	createConfiguration: createConfiguration
	removeConfiguration: removeConfiguration
