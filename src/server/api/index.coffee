config     = require "config"
{ Router } = require "express"
pkg        = require "../../../package.json"

router = Router()

router.get "/versioning", (req, res) ->
	res
		.status 200
		.send host: config.versioning.docker.host
		.end()

router.get "/version", (req, res) ->
	res
		.status 200
		.send version: pkg.version
		.end()

module.exports = router
