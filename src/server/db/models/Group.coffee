mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	label:        String
	applications: Object
,
	minimize: false # allows empty applications to be stored

schema.statics.findByLabel = (name) ->
	@findOne label: name

schema.query.hasDocuments = ->
	@countDocuments() isnt 0

schema.plugin addImmutableQuery

module.exports = mongoose.model "Group", schema
