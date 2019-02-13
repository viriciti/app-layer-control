module.exports = (mongoose) ->
	mongoose.model "AllowedImage",
		name:
			type:     String
			required: true
			unique:   true
