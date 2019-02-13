module.exports = (mongoose) ->
	mongoose.model "DeviceSource",
		name:
			type:     String
			required: true
			unique:   true

		editable:
			type:    Boolean
			default: true

		headerName:
			type:     String
			required: true

		headerStyle: Object

		getIn:
			type:     String
			required: true

		fallbackGetIn:
			type:    String
			default: ""

		getInTitle:
			type:    String
			default: ""

		defaultValue:
			type:    String
			default: ""

		columnIndex:
			type:    Number
			default: -1

		sortable:
			type:    Boolean
			default: false

		copyable:
			type:    Boolean
			default: false

		filterable:
			type:    Boolean
			default: false

		filterFormat: Object

		format:
			type:    String
			default: "default"

		entryInTable:
			type:    Boolean
			default: false

		entryInDetail:
			type:    Boolean
			default: false
