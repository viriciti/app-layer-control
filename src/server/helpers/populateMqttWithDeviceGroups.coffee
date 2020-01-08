{ map } = require "lodash"
log     = require("../lib/Logger") "populate"

module.exports = (db, socket) ->
	devices = await db.DeviceState.find().select "groups deviceId"
	
	# log.info "Populating groups on MQTT for #{devices.length} device(s)"
	# await Promise.all devices.map ({ deviceId, groups }) ->
	# 	topic   = "devices/#{deviceId}/groups"
	# 	groups  = JSON.stringify map groups, "label"
	# 	options = retain: true

		# socket.publish topic, groups, options