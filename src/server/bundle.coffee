config  = require "config"
debug   = (require "debug") "app:bundle"
express = require "express"
path    = require "path"

directory    = path.resolve __dirname, "..", "client"
fileLocation = path.resolve directory, "index.html"

module.exports = (app) ->
	if config.server.skipBundler or process.env.NODE_ENV is "production"
		debug "Serving from #{directory}"

		app.use (req, res, next) ->
			return next() if process.env.NODE_ENV is "production"
			return next() if req.originalUrl.startsWith "/api"

			res.send "Bundling is skipped, only the API is accessible"

		app.use express.static directory

		Promise.resolve()
	else
		debug "Building with parcel-bundler ..."

		# parcel
		Bundler = require "parcel-bundler"
		bundler = new Bundler fileLocation

		new Promise (resolve, reject) ->
			bundler
				.once "bundled",    resolve
				.once "buildError", reject

			app.use bundler.middleware()
