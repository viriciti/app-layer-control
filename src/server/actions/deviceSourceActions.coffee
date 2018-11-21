{ omit } = require "underscore"

module.exports = (db) ->
	editColumn = ({ payload, meta }, cb) ->
		query   = headerName: meta.name
		update  = Object.assign {}, payload, getIn: payload.getIn

		db.DeviceSource.findOneAndUpdate query, update, (error, result) ->
			return cb error if error

			cb null, omit result, "_id"

	addColumn = ({ payload }, cb) ->
		db.DeviceSource.create payload, cb

	removeColumn = ({ meta }, cb) ->
		db.DeviceSource.findOneAndRemove headerName: meta.name, cb

	{ editColumn, addColumn, removeColumn }
