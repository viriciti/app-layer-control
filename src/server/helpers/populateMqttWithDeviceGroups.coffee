{ uniqBy } = require "lodash"

module.exports = (db, mqttSocket, cb) ->
	devices = uniqBy (await db.DeviceGroup
		.find {}
		.populate "groups"
		.lean()
	), "deviceId"

	await Promise.all devices.map ({ deviceId, groups }) ->
		new Promise (resolve, reject) ->
			topic  = "devices/#{deviceId}/groups"
			groups = JSON.stringify groups.map ({ label }) -> label
			options = retain: true

			mqttSocket.publish topic, groups, options, (error) ->
				return reject error if error
				resolve()
