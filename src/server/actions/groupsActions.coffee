async  = require "async"
config = require "config"

debug = (require "debug") "app:actions:groupsActions"

module.exports = (db, mqttSocket) ->
	{ enrich } = (require "../helpers/enrichAppsForMqtt") db

	createGroup = ({ payload }, cb) ->
		{ label } = payload

		async.series [
			(cb) ->
				return cb() if label is "default"

				db.Group.findOne { label: "default" }, (error, group) ->
					return cb error if error
					return cb new Error "Group 'default' must exist prior to other groups" unless group

					cb()
			(cb) ->
				db.Group.findOneAndUpdate { label }, payload, { upsert: true }, cb

			publishGroups

		], (error) ->
			return cb error if error
			cb null, "Group #{label} created correctly"

	removeGroup = ({ payload: label }, cb) ->
		return cb new Error "It is not possible to remove the default group" if label is "default"

		db.Group.findOneAndRemove { label }, (error) ->
			return cb error if error

			publishGroups (error) ->
				return cb error if error
				cb null, "Group #{label} removed correctly"

	publishGroups = (cb) ->
		async.waterfall [
			(cb) ->
				db.Group.find {}, cb

			(groups, cb) ->
				async.reduce groups, {}, (memo, group, cb) ->
					enrich group.label, group.applications, (error, appsToInstall) ->
						return cb error if error

						memo[group.label] = appsToInstall
						cb null, memo
				, cb

			(enrichedGroups, cb) ->
				if config.readOnly
					debug "Read only mode, not sending enriched groups to MQTT"
					return cb()

				topic   = "global/collections/groups"
				message = JSON.stringify enrichedGroups
				options = retain: true

				mqttSocket.publish topic, message, options, cb
		], cb

	return {
		createGroup,
		removeGroup,
		publishGroups
	}
