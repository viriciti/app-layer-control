{ Map, List } = require "immutable"

module.exports = (currentContainers = List()) ->
	notRunning = currentContainers
		.filter (container) ->
			status   = container.getIn ["state", "status"]
			exitCode = container.getIn ["state", "exitCode"]
			type     = container.getIn ["restartPolicy", "type"]

			# If policy is on failure, exit code MUST be 0
	 		# If policy is unless-stopped or none, container can be stopped
	 		# Otherwise, ensure container is running
			if type is "on-failure"
				exitCode isnt 0
			else if type in ["unless-stopped", "no"]
				false
			else
				status isnt "running"

	# Convert the List to a Map keyed by container name
	Map notRunning.map (container) ->
		[
			(container.get "name")
			Map
				status:   container.getIn ["state", "status"]
				exitCode: container.getIn ["state", "exitCode"]
		]
