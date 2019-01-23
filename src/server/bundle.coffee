config  = require "config"
debug   = (require "debug") "app:bundle"
express = require "express"
path    = require "path"

directory    = path.resolve __dirname, "..", "client"
fileLocation = path.resolve directory, "index.html"

module.exports = (app) ->
	unless config.server.skipBundler or process.env.NODE_ENV is "production"
		debug "Building with parcel-bundler ..."

		# parcel
		Bundler = require "parcel-bundler"
		bundler = new Bundler fileLocation

		new Promise (resolve, reject) ->
			bundler
				.once "bundled",    resolve
				.once "buildError", reject

			app.use bundler.middleware()
	else
		debug "Serving from #{directory}"

		app.use express.static directory
		app.use "*", (req, res, next) ->
			res.sendFile fileLocation, (error) ->
				return next error if error

		Promise.resolve()
