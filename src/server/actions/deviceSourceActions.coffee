module.exports = (db) ->
	editColumn = ({ payload, meta }) ->
		query   = headerName: meta.name
		update  = Object.assign {}, payload, getIn: payload.getIn

		await db.DeviceSource.findOneAndUpdate query, update
		await db.DeviceSource.find(query).select "-_id, -__v"

	addColumn = ({ payload }) ->
		await db.DeviceSource.create payload

	removeColumn = ({ meta }, cb) ->
		await db.DeviceSource.findOneAndRemove headerName: meta.name

	addColumn:    addColumn
	editColumn:   editColumn
	removeColumn: removeColumn
