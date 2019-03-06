mongoose          = require "mongoose"
addImmutableQuery = require "../plugins/addImmutableQuery"

{ Schema } = mongoose
schema     = new Schema
	headerName:
		type:     String
		required: true
		unique:   true

	getIn:
		type:     String
		required: true

	getInTitle:
		type:    String
		default: ""

	defaultValue: Schema.Types.Mixed

	columnIndex:
		type:    Number
		default: -1

	columnWidth: Number

	sortable:
		type:    Boolean
		default: false

	copyable:
		type:    Boolean
		default: false

	filterable:
		type:    Boolean
		default: false

	format:
		type:    String
		default: "default"

	entryInTable:
		type:    Boolean
		default: false

	entryInDetail:
		type:    Boolean
		default: false

schema.plugin addImmutableQuery

module.exports = mongoose.model "DeviceSource", schema
