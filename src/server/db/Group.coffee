module.exports = (mongoose) ->
	Group = mongoose.model "group",
		label:        String
		applications: Object

	Group
