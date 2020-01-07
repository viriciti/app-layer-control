mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"
Group             = require "./Group"

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
schema.pre "updateOne", ->
	update = @getUpdate()
	return unless update.groups


	console.log update.groups

	@setUpdate Object.assign {},
		update
		groups: (await Group
			.find label: $in: update.groups
			.select "_id"
			.lean()
		)

module.exports = mongoose.model "DeviceState", schema
