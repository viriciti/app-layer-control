module.exports =

	mqtt:
		clientId: "app-layer-control"
		host: "vernemq"
		port: 1883
		readOnly: false

	portalApi:
		api:
			host:       "portal"
			port:       8080
			apiVersion: "v2"
		serviceName: "app-layer-control"

	db:
		hosts: [
			{ host: "ndb-004", port: 27022 }
			{ host: "ndb-005", port: 27022 }
			{ host: "ndb-006", port: 27022 }
		]
		options:
			replSet:    "uberdb0"
			replicaSet: "uberdb0"

	versioning:
		git:
			host: "git.viriciti.com"

		docker:
			host:     "docker.viriciti.com"
			username: "device-user"
			password: process.env.GITLAB_ACCESS_TOKEN
