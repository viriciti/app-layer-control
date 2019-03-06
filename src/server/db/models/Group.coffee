mongoose          = require "mongoose"
addImmutableQuery = require "../addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	label:        String
	applications: Object
,
	minimize: false # allows empty applications to be stored

schema                     = addImmutableQuery schema
schema.statics.findByLabel = (name) ->
	@findOne label: name

schema.query.hasDocuments = ->
	@countDocuments() isnt 0

module.exports = mongoose.model "Group", schema
