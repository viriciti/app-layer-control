module.exports = (db, socket) ->
	devices = await db.DeviceGroup
		.find {}
		.distinct "deviceId"
		.lean()

	await Promise.all devices.map ({ deviceId, groups }) ->
		topic   = "devices/#{deviceId}/groups"
		groups  = JSON.stringify groups
		options = retain: true

		socket.publish topic, groups, options
