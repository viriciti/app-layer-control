mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"
Group             = require "./Group"

{ Schema } = mongoose
schema     = new Schema
	connected: Boolean
	groups:
		type:    [String]
		default: ["default"]
	deviceId:
		type:     String
		required: true
		unique:   true
		index:    true
	updateState:
		short: String
		long:  String
	systemInfo:
		apiVersion: String
		appVersion: String
		eth0:       String
		kernel:     String
		osVersion:  String
		tun0:       String
		version:    String
		wwan0:      String
	containers: Schema.Types.Mixed
	images:     Schema.Types.Mixed
	external:   Schema.Types.Mixed

schema.plugin addImmutableQuery

module.exports = mongoose.model "DeviceState", schema
