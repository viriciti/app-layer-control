{ Schema } = require "mongoose"

module.exports = (mongoose) ->
	mongoose.model "DeviceGroup",
		deviceId:
			type:     String
			required: true
			unique:   true
		groups: [
			type:     Schema.Types.ObjectId
			ref:      "Group"
			required: true
		]
