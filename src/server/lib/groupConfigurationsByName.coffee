{ Map } = require "immutable"

module.exports = (store) ->
	throw new Error "No store found in input" unless store?

	groups         = store.get "groups"
	configurations = store.get "configurations"

	groups.map (containers) ->
		containers
			.keySeq()
			.reduce (memo, container) ->
				configuration = configurations.get container
				containerName = configuration.get "containerName"

				memo.set containerName, configuration
			, Map()
