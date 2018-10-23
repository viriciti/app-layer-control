module.exports = (mongoose) ->
	RegistryImages = mongoose.model "registryImages",
		access:         Boolean
		name:           String
		versions:       [String]
		enabledVersion: String # deprecated, required to remove the field from the document

	RegistryImages
