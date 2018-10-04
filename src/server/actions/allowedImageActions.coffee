module.exports = (db, mqttSocket) ->
	addAllowedImage = ({ payload }, cb) ->
		{ name } = payload
		db.AllowedImage.create { name }, (error) ->
			return cb error if error
			cb null, "AllowedImage #{name} added"

	removeAllowedImage = ({ payload }, cb) ->
		{ name } = payload
		db.AllowedImage.findOneAndRemove { name }, (error) ->
			return cb error if error
			cb null, "AllowedImage #{name} removed"

	{ addAllowedImage, removeAllowedImage }

