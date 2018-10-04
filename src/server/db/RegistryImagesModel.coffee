module.exports = (mongoose) ->
	RegistryImages = mongoose.model "registryImages",
		enabledVersion: String
		exists:         Boolean
		name:           String
		versions:       [String]

	RegistryImages
