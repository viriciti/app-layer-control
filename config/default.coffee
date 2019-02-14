os = require "os"

module.exports =
	batchState:
		nsStateInterval: 500
		defaultInterval: 3000

	server:
		port:        3000
		skipUpdates: false

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
				width:    "10px"
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
			headerName:   "Serial"
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

		tun0IP:
			headerName:   "VPN IP"
			defaultValue: ""
			columnIndex:  50
			sortable:     false
			filterable:   false
			copyable:     true
			getIn:        "systemInfo.tun0"
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable:  true
			entryInDetail: true

		groups:
			headerName:   "Groups"
			defaultValue: ""
			columnIndex:  60
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
			columnIndex:  70
			sortable:     true
			filterable:   false
			copyable:     false
			getIn:        "systemInfo.appVersion"
			editable:     false
			headerStyle:
				minWidth: "100px"
			entryInTable: true

		vid:
			headerName:    "VID"
			getIn:         "vid"
			columnIndex:   35
			entryInDetail: true
			entryInTable:  true
			editable:      false
			sortable:      true
			filterable:    true

		# Detail-only entries
		linuxKernel:
			headerName:    "Linux kernel"
			getIn:         "systemInfo.linuxKernel"
			columnIndex:   41
			entryInDetail: true
			editable:      false

		version:
			headerName:   "Docker version"
			getIn:        "systemInfo.version"
			columnIndex:   42
			entryInDetail: true
			editable:      false

		ppp0IP:
			headerName:    "Cellular IP"
			getIn:         "systemInfo.ppp0"
			columnIndex:   51
			entryInDetail: true
			editable:      false

		eth0IP:
			headerName:    "Ethernet IP"
			getIn:         "systemInfo.eth0"
			columnIndex:   52
			entryInDetail: true
			editable:      false
