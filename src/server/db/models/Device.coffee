DeviceGroup       = require "./DeviceGroup"
addImmutableQuery = require "../plugins/addImmutableQuery"
mongoose          = require "mongoose"

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
	connected:  Boolean
	systemInfo: systemInfoSchema

schema.statics.aggregateGroups = ->
	@aggregate [
		$lookup:
			from:         DeviceGroup.collection.name
			localField:   "deviceId"
			foreignField: "deviceId"
			as:           "groups"
	,
		$unwind: "$groups"
	,
		$addFields:
			groups: "$groups.groups"
	]

schema.plugin addImmutableQuery

module.exports = mongoose.model "Device", schema
