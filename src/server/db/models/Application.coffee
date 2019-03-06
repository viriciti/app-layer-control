mongoose          = require "mongoose"
addImmutableQuery = require "../addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	applicationName: String
	containerName:   String
	detached:        Boolean
	environment:     [String]
	fromImage:       String
	frontEndPort:    Number
	lastInstallStep: String
	mounts:          [String]
	networkMode:     String
	ports:           Schema.Types.Mixed
	privileged:      Boolean
	restartPolicy:   String
	version:         String

schema                    = addImmutableQuery schema
schema.statics.findByName = (name) ->
	@findOne applicationName: name

module.exports = mongoose.model "Configuration", schema
