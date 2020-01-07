mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	connected: Boolean
	groups:    [
		type: Schema.Types.ObjectId
		ref:  "Group"
	]
	deviceId:
		type:     String
		required: true
		unique:   true
		index:    true
	systemInfo:
		apiVersion: String
		appVersion: String
		eth0:       String
		kernel:     String
		osVersion:  String
		tun0:       String
		version:    String
	containers: Schema.Types.Mixed
	images:     Schema.Types.Mixed
	external:   Schema.Types.Mixed

schema.plugin addImmutableQuery

module.exports = mongoose.model "DeviceState", schema
