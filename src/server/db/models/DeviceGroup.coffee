mongoose          = require "mongoose"
addImmutableQuery = require "../addImmutableQuery"

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

schema = addImmutableQuery schema

module.exports = mongoose.model "DeviceGroup", schema
