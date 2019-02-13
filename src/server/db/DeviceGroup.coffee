module.exports = (mongoose) ->
	mongoose.model "DeviceGroup",
		deviceId:
			type:     String
			required: true
			unique:   true
			index:    true
		groups: [
			type:     String
			required: true
		]
