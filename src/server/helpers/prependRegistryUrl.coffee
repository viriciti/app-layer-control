config = require "config"

module.exports = (repository) ->
	"#{config.versioning.docker.host}/#{repository}"
