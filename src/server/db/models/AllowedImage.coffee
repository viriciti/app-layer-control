mongoose          = require "mongoose"
addImmutableQuery = require "../addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	name:
		type:     String
		required: true
		unique:   true

schema = addImmutableQuery schema

module.exports = mongoose.model "AllowedImage", schema
