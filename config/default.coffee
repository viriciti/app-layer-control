os = require "os"

module.exports =
	batchState:
		nsStateInterval: 500
		defaultInterval: 3000

	server:
		port:        3000
		skipUpdates: false
		skipBundler: true
		npm:
			username: process.env.NPM_USERNAME
			password: process.env.NPM_PASSWORD
			email:    process.env.NPM_EMAIL

	mqtt:
		clientId:        "app-layer-control-#{os.hostname()}"
		host:            "localhost"
		port:            1883
		responseTimeout: 5000

	db:
		hosts: [
			host: "localhost"
			port: 27017
		]
		name: "app-layer-control"
		options:
			replSet: "rs0"

	versioning:
		maxTokenAttempts: 3
		checkingTimeout:  600000

	plugins: [
		name: "express"
	]

	defaultColumns:
		onlineStatus:
			headerName:   "Status"
			getIn:        "status"
			defaultValue: false
			columnIndex:  0
			sortable:     true
			filterable:   true
			copyable:     false
			format:       "status"
			filterFormat:
				type:    "checkboxes"
				options: [
					{ value: "online",  label: "Online" }
					{ value: "offline", label: "Offline" }
				]
			editable:     false
			headerStyle:
				minWidth: "0px"
				width:    "100px"
			entryInTable: true

		updateState:
			headerName:   "Update State"
			defaultValue: "Idle"
			columnIndex:  10
			sortable:     true
			filterable:   true
			copyable:     false
			getIn:        "updateState.short"
			getInTitle:   "updateState.long"
			editable:     false
			filterFormat:
				type:    "checkboxes"
				options: [
					{ value: "error",    label: "Error" }
					{ value: "updating", label: "Updating" }
					{ value: "idle",     label: "Idle" }
				]
			format: "updateState"
			headerStyle:
				minWidth: "200px"
			entryInTable:  true
			entryInDetail: true

		alerts:
			headerName:   "Active alerts"
			defaultValue: ""
			columnIndex:  20
			sortable:     true
			copyable:     false
			getIn:        "activeAlerts"
			format:       "alerts"
			filterable:   true
			filterFormat:
				type:    "checkboxes"
				options: [
					{ value: "containersNotRunning", label: "Container is down" }
					{ value: "versionsNotMatching",  label: "Outdated software" }
				]
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable: true

		lastSeenDuration:
			headerName:   "Last seen"
			defaultValue: ""
			columnIndex:  30
			sortable:     true
			filterable:   false
			copyable:     false
			getIn:        "lastSeenTimestamp"
			format:       "fromNow"
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable: true

		deviceId:
			headerName:   "Device ID"
			defaultValue: ""
			columnIndex:  40
			sortable:     true
			filterable:   true
			copyable:     true
			getIn:        "deviceId"
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable:  true
			entryInDetail: true

		groups:
			headerName:   "Groups"
			defaultValue: ""
			columnIndex:  50
			sortable:     true
			filterable:   true
			copyable:     false
			getIn:        "groups"
			editable:     false
			headerStyle:
				width: "150px"
			entryInTable: false

		appVersion:
			headerName:   "App Version"
			defaultValue: ""
			columnIndex:  60
			sortable:     true
			filterable:   false
			copyable:     false
			getIn:        "systemInfo.appVersion"
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable: true
