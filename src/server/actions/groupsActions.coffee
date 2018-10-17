async  = require "async"
config = require "config"
_      = require "underscore"

debug = (require "debug") "app:actions:groupsActions"

module.exports = (db, mqttSocket) ->
	{ enrich } = (require "../helpers/enrichAppsForMqtt") db

	createGroup = ({ payload }, cb) ->
		{ label, applications } = payload

		if label is "default" and not _.size applications
			return cb new Error "Can not have a default group with 0 applications"

		async.series [
			(cb) ->
				return cb() if label is "default"

				db.Group.findOne { label: "default" }, (error, group) ->
					return cb error if error
					return cb new Error "Can't add new group if the 'default' group does not exist" unless group

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

				mqttSocket.customPublish
					topic:   "global/collections/groups"
					message: JSON.stringify enrichedGroups
					opts:
						qos:    0
						retain: true
				, cb


		], cb

	return {
		createGroup,
		removeGroup,
		publishGroups
	}
