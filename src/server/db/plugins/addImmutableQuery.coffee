{ fromJS } = require "immutable"

module.exports = (schema) ->
	schema.query.immutable = ->
		fromJS @lean()

	schema
