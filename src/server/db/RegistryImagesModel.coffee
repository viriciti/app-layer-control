module.exports = (mongoose) ->
	RegistryImages = mongoose.model "registryImages",
		exists:         Boolean
		name:           String
		versions:       [String]

	RegistryImages
