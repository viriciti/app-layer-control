mongoose = require "mongoose"

schema = new mongoose.Schema
	deviceId:
		type:     String
		required: true
		unique:   true
		index:    true
	groups:
		type:     [String]
		required: true
		default:  ["default"]

module.exports = ->
	mongoose.model "DeviceGroup", schema
