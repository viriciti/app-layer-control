{ last }                               = require "underscore"
{ createGroupsMixin, getAppsToChange } = require "@viriciti/app-layer-logic"
{ Map, List, fromJS }                  = require "immutable"

module.exports = ({ groups, deviceGroups, currentContainers, images }) ->
	currentContainers or= List()
	containers          = currentContainers.reduce (normalized, container) ->
		normalized.set container.get("name"), container
	, Map()

	groupsMixin  = createGroupsMixin groups.toJS(), deviceGroups
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
