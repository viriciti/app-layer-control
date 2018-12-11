module.exports =

	mqtt:
		clientId: "app-layer-control"
		host: "vernemq"
		port: 1883
		readOnly: false

	portalApi:
		api:
			host: "portal"

	db:
		hosts: [
			{ host: "ndb-004", port: 27022 }
			{ host: "ndb-005", port: 27022 }
			{ host: "ndb-006", port: 27022 }
		]
		options: replicaSet: "uberdb0"
