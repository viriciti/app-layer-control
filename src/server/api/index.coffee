config     = require "config"
{ Router } = require "express"

getPackageVersion = require "../helpers/getPackageVersion"
log               = (require "../lib/Logger") "api"

router = Router()

router.get "/versioning", (req, res) ->
	res
		.status 200
		.send
			status: "success"
			data:   host: config.versioning.registry.url
		.end()

router.get "/version", (req, res) ->
	res
		.status 200
		.send
			status: "success"
			data:   version: await getPackageVersion()
		.end()

router.use "/v1", require "./v1"

# Error middleware
router.use (error, req, res, next) ->
	log.error error.stack

	res.sendStatus 500

module.exports = router
