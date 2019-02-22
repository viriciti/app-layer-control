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
		host:            process.env.MQTT_HOST or "localhost"
		port:            process.env.MQTT_PORT or 1883
		responseTimeout: 5000

	db:
		hosts: process.env.DB_HOSTS or "localhost:27017"
		name: "app-layer-control"
		options:
			replSet: process.env.DB_REPLICA_SET or "rs0"

	versioning:
		maxTokenAttempts: 3
		checkingTimeout:  600000
		registry:
			url:         process.env.DOCKER_REGISTRY
			host:        process.env.GITLAB_HOST
			username:    process.env.GITLAB_USERNAME
			accessToken: process.env.GITLAB_ACCESS_TOKEN

	plugins: []

	defaultColumns: [
		columnIndex:  0
		columnWidth:  25
		copyable:     false
		defaultValue: false
		entryInTable: true
		filterable:   true
		format:       "status"
		getIn:        "status"
		headerName:   "Status"
		sortable:     true
	,
		columnIndex:   10
		columnWidth:   200
		copyable:      false
		defaultValue:  "Idle"
		entryInDetail: true
		entryInTable:  true
		filterable:    true
		format:        "updateState"
		getIn:         "updateState.short"
		getInTitle:    "updateState.long"
		headerName:    "State"
		sortable:      true
	,
		columnIndex:  30
		columnWidth:  100
		copyable:     false
		defaultValue: ""
		editable:     false
		entryInTable: true
		filterable:   false
		format:       "fromNow"
		getIn:        "lastSeenTimestamp"
		headerName:   "Last seen"
		sortable:     true
	,
		columnIndex:   40
		columnWidth:   100
		copyable:      true
		defaultValue:  ""
		editable:      false
		entryInDetail: true
		entryInTable:  true
		filterable:    true
		getIn:         "deviceId"
		headerName:    "Device ID"
		sortable:      true
	,
		columNWidth:  100
		columnIndex:  50
		copyable:     false
		defaultValue: ""
		editable:     false
		entryInTable: false
		filterable:   true
		getIn:        "groups"
		headerName:   "Groups"
		sortable:     true
	,
		columnIndex:  60
		columnWidth:  100
		copyable:     false
		defaultValue: ""
		editable:     false
		entryInTable: true
		filterable:   false
		getIn:        "systemInfo.appVersion"
		headerName:   "App Version"
		sortable:     true
	]
