module.exports =
	readOnly: false

	devicemqtt:
		host: "vernemq"
		port: 1883
		clientId: "app-layer-control"

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

	consul:
		host: "consul"
		env:  "production"
