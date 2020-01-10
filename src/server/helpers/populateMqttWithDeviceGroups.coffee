{ map } = require "lodash"
log     = require("../lib/Logger") "populate"

module.exports = (db, socket) ->
	devices = await db.DeviceState.find(groups: $ne: []).select "groups deviceId"

	log.info "Populating groups on MQTT for #{devices.length} device(s)"
	await Promise.all devices.map ({ deviceId, groups }) ->
		topic   = "devices/#{deviceId}/groups"
		groups  = JSON.stringify groups
		options = retain: true

		socket.publish topic, groups, options
