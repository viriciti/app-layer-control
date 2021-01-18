mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	applicationName: String
	containerName:   String
	detached:        Boolean
	environment:     [String]
	fromImage:       String
	dependencies:    [String]
	frontEndPort:    Number
	lastInstallStep: String
	mounts:          [String]
	networkMode:     String
	ports:           Schema.Types.Mixed
	urlTemplate:     String
	privileged:      Boolean
	restartPolicy:   String
	version:         String

schema.statics.findByName = (name) ->
	@findOne applicationName: name

schema.query.hasDocuments = ->
	@countDocuments() isnt 0

schema.plugin addImmutableQuery

module.exports = mongoose.model "Configuration", schema
