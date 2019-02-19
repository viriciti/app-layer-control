config = require "config"

module.exports = (repository) ->
	"#{config.versioning.registry.url}/#{repository}"
