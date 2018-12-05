async = require "async"

module.exports = (db, mqttSocket) ->
	addAllowedImage = ({ payload }, cb) ->
		{ name } = payload
		db.AllowedImage.create { name }, (error) ->
			return cb error if error
			cb null, "AllowedImage #{name} added"

	removeAllowedImage = ({ payload }, cb) ->
		{ name } = payload

		async.parallel [
			(next) ->
				db.AllowedImage.findOneAndRemove { name }, next
			(next) ->
				db.RegistryImages.findOneAndRemove name: $regex: "#{name}$", next
		], (error) ->
			return cb error if error
			cb null, "AllowedImage #{name} removed"

	{ addAllowedImage, removeAllowedImage }
