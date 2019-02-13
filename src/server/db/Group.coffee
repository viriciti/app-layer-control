mongoose = require "mongoose"

module.exports = ->
	mongoose.model "Group",
		label:        String
		applications: Object
