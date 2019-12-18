mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema

schema.plugin addImmutableQuery

module.exports = mongoose.model "DeviceState", schema
