mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema }       = mongoose
systemInfoSchema = new Schema
	apiVersion: String
	appVersion: String
	kernel:     String
	osVersion:
		type:    String
		default: "n/a"
	ppp0:       String
	tun0:       String
	version:    String
,
	_id: false

schema     = new Schema
	containers: Object
	deviceId:
		type:     String
		required: true
		unique:   true
		index:    true
	images:     Array
	systemInfo: systemInfoSchema

schema.plugin addImmutableQuery

module.exports = mongoose.model "Device", schema
