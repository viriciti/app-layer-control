mongoose = require "mongoose"

module.exports = ->
	schema = new mongoose.Schema
		label:        String
		applications: Object
	,
		minimize: false

	mongoose.model "Group", schema
