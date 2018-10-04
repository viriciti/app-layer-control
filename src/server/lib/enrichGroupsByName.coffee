{ fromJS } = require "immutable"
semver     = require "semver"

groupConfigurationsByName = require "../lib/groupConfigurationsByName"

module.exports = (store) ->
	throw new Error "No store found in input" unless store?

	configurationsByGroup = groupConfigurationsByName store
	images                = store.getCache "enabledRegistryImages"
	availableImages       = store.getCache "registryImages"

	configurationsByGroup.map (applications, groupName) ->
		applications.map (configuration, name) ->
			fromImage = configuration.get "fromImage"
			version   = images.get fromImage
			version   = semver.maxSatisfying availableImages.getIn([fromImage, "versions"]), "*" if groupName.endsWith "test"

			configuration.merge fromJS
				fromImage:     "#{fromImage}:#{version}"
				containerName: name
				labels:
					group:  groupName
					manual: "false"
