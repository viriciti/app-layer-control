config     = require "config"
{ Router } = require "express"

getPackageVersion = require "../helpers/getPackageVersion"

router = Router()

router.get "/versioning", (req, res) ->
	res
		.status 200
		.send
			status: "success"
			data:   host: config.versioning.docker.host
		.end()

router.get "/version", (req, res) ->
	res
		.status 200
		.send
			status: "success"
			data:   version: await getPackageVersion()
		.end()

router.use "/v1", require "./v1"

module.exports = router
