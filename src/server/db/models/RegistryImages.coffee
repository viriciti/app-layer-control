module.exports = (mongoose) ->
	mongoose.model "RegistryImages",
		access:         Boolean
		name:           String
		versions:       [String]
		exists:         Boolean # deprecated, required to remove field from the document
		enabledVersion: String  # deprecated, required to remove the field from the document
