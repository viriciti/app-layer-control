config     = require "config"
{ Router } = require "express"

getPackageVersion = require "../helpers/getPackageVersion"

router = Router()

router.get "/versioning", (req, res) ->
	res
		.status 200
		.send host: config.versioning.docker.host
		.end()

router.get "/version", (req, res) ->
	res
		.status 200
		.send version: await getPackageVersion()
		.end()

module.exports = router
