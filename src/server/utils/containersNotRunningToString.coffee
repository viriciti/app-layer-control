module.exports = (containers) ->
	containers
		.map (container, name) ->
			"#{name} is not running"
		.join "\n"
