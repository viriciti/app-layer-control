config     = require "config"
{ Router } = require "express"

router = Router()

router.get "/versioning", (req, res) ->
	console.log req.params.key

	res
		.status 200
		.send JSON.stringify
			host: config.versioning.docker.host
		.end()

module.exports = router
