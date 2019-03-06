{ Schema } = require "mongoose"
{ fromJS } = require "immutable"

module.exports = (schema) ->
	unless schema instanceof Schema
		throw new Error "Not a mongoose Schema"

	if schema.query.immutable
		throw new Error "Schema already has an ImmutableJS helper attached"

	schema.query.immutable = ->
		fromJS @lean()

	schema
