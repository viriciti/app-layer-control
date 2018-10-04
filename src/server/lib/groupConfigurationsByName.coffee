{ Map } = require "immutable"

module.exports = (store) ->
	throw new Error "No store found in input" unless store?

	groups         = store.getCache "groups"
	configurations = store.getCache "configurations"

	groups.map (containers) ->
		containers.reduce (memo, container) ->
			configuration = configurations.get container
			containerName = configuration.get "containerName"

			memo.set containerName, configuration
		, Map()
