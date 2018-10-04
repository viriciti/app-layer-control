module.exports = (mongoose) ->
	AllowedImage = mongoose.model "allowedImage",
		name:
			type:     String
			required: true
			unique:   true

	AllowedImage

