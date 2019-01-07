{ Schema } = require "mongoose"

module.exports = (mongoose) ->
	DeviceGroup = mongoose.model "deviceGroup",
		deviceId:
			type:     String
			required: true
		group:
			type:     Schema.Types.ObjectId
			ref:      "Group"
			required: true

	DeviceGroup
