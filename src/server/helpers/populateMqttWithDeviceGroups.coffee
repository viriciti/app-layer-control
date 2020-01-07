{ map } = require "lodash"

module.exports = (db, socket) ->
	devices = await db.DeviceState
		.find()
		.populate "groups"
		.select "groups deviceId"

	await Promise.all(
		devices
			.filter ({ groups }) ->
				groups.length isnt 0
			.map ({ deviceId, groups }) ->
				topic   = "devices/#{deviceId}/groups"
				groups  = JSON.stringify map groups, "label"
				options = retain: true

				socket.publish topic, groups, options
	)