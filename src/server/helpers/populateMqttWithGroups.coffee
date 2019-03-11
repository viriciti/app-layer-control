debug    = (require "debug") "app:populateMqttWithGroups"
reduce   = require "p-reduce"
{ size } = require "lodash"

log               = (require "../lib/Logger") "populateMqttWithGroups"
enrichAppsForMqtt = require "./enrichAppsForMqtt"

module.exports = (db, socket) ->
	groups         = await db.Group.find {}
	enrichedGroups = await reduce groups, (memo, { label, applications }) ->
		try
			memo[label] = await enrichAppsForMqtt label, applications
		catch
			log.warn "Failed to enrich applications for #{label}"

		memo
	, {}

	topic   = "global/collections/groups"
	message = JSON.stringify enrichedGroups
	options = retain: true

	Object
		.keys enrichedGroups
		.forEach (name) ->
			debug "Enriching #{size enrichedGroups[name]} application(s) for #{name}"

	socket.publish topic, message, options
