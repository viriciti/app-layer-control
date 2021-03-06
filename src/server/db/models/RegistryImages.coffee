mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	access:         Boolean
	name:           String
	versions:       [String]
	exists:         Boolean # deprecated, required to remove field from the document
	enabledVersion: String  # deprecated, required to remove the field from the document

schema.plugin addImmutableQuery

module.exports = mongoose.model "RegistryImages", schema
