mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	name:
		type:     String
		required: true
		unique:   true

schema.plugin addImmutableQuery

module.exports = mongoose.model "AllowedImage", schema
