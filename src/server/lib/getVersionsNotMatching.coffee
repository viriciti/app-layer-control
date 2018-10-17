semver                                 = require "semver"
{ Map, List, fromJS }                  = require "immutable"
{ createGroupsMixin, getAppsToChange } = require "@viriciti/app-layer-logic"
{ last }                               = require "underscore"

replaceVersionWithConfiguration = ({ images, groups, configurations }) ->
	groups.map (applications, name) ->
		applications.map (version, application) ->
			configuration = configurations.get application
			fromImage     = configuration.get "fromImage"

			if name.endsWith("test") or not version
				versions = images
					.getIn  [fromImage, "versions"]
					.filter (tag) -> semver.valid tag
				version = semver.maxSatisfying versions, "*"

			configuration.merge fromJS
				containerName: application
				fromImage:     "#{fromImage}:#{version}"
				labels:
					group:  name
					manual: "false"

module.exports = ({ store, deviceGroups, currentContainers }) ->
	currentContainers or= List()
	containers          = currentContainers.reduce (normalized, container) ->
		normalized.set container.get("name"), container
	, Map()

	enrichedGroups = replaceVersionWithConfiguration
		configurations: store.getCache "configurations"
		groups:         store.getCache "groups"
		images:         store.getCache "registryImages"
	groupsMixin  = createGroupsMixin enrichedGroups.toJS(), deviceGroups
	appsToChange = getAppsToChange groupsMixin, containers.toJS()

	fromJS appsToChange.install
		.map (app) ->
			Map
				fromImage:     app.get "fromImage"
				containerName: app.get "containerName"
		.reduce (versions, app) ->
			fromImage     = app.get "fromImage"
			containerName = app.get "containerName"

			versions.set containerName, Map
				actual:        last containers.getIn([containerName, "image"])?.split ":"
				expected:      last fromImage.split ":"
				containerName: containerName
		, Map()
