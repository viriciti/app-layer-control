mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	deviceId:
		type:     String
		required: true
		unique:   true
		index:    true
	groups:
		type:     [String]
		required: true
		default:  ["default"]

schema.statics.findByDevices = (devices) ->
	@find deviceId: $in: devices

schema.plugin addImmutableQuery

module.exports = mongoose.model "DeviceGroup", schema
