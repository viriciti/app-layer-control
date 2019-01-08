config     = require "config"
{ Router } = require "express"

router = Router()

router.get "/versioning", (req, res) ->
	res
		.status 200
		.send host: config.versioning.docker.host
		.end()

module.exports = router
