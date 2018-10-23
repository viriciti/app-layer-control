_       = require "underscore"
async   = require "async"
config  = require "config"
debug   = (require "debug") "app:Versioning"
log     = (require "./Logger") "Versioning"
request = require "request"
semver  = require "semver"
url     = require "url"

class Versioning
	constructor: ({ @docker, @git, @cacheTime = 60 }) ->
		throw new Error "No Docker configuration specified" unless @docker?
		throw new Error "No Git configuration specified" unless @git?

		@tokens        = {}
		@tokenAttempts = {}
		@cached        = {}

	renewToken: (image, cb) =>
		debug "[renewToken] Renewing token for '#{image}'"

		@tokenAttempts[image] or= 0
		@tokenAttempts[image] +=  1

		async.retry
			times:    10
			interval: 2000
		, (cb) =>
			request
				url:     @getGitURL image
				headers: @getGitHeaders()
			, (error, response, body) =>
				return cb error if error

				debug "[renewToken] Renewed token for '#{image}', body", body.toString()

				try
					json = JSON.parse body.toString()
				catch error
					debug "Failed parsing body: #{error.message}. Json: \n", body.toString()
					return cb error

				if json?.errors
					message = json
						.errors
						.map  (error) -> "[#{image}] #{error.message}"
						.join ", "

					log.warn message
					return cb new Error message

				unless json?.token
					debug "Wrong token object", json
					return cb new Error "Wrong token object"

				token = @tokens[image] = json.token

				cb null,
					image: image
					token: token
		, cb

	getToken: (image, cb) =>
		if @tokens[image]?
			debug "[getToken] Token for '#{image}' already exists, reusing"

			return cb null,
				image: image
				token: @tokens[image]

		@renewToken image, cb

	getTokens: (names, cb) ->
		async.map names, @getToken, cb

	getImage: (name, cb) =>
		debug "[getImage] Get image:", name

		cacheTimeDiff  = @cached[name]?.cacheTime + (@cacheTime * 1000)

		if @cached[name]?
			if cacheTimeDiff > Date.now()
				debug "[getImage] Serving #{name} from cache, time left: #{cacheTimeDiff - Date.now()}ms"
				return cb null,
					"#{name}":
						versions: @cached[name].versions
						access:   true
			else
				debug "[getImage] '#{name}' in cache expired, invalidating"
				delete @cached[name]

		debug "[getImage] Get token"
		@getToken name, (error, token) =>
			return cb error if error

			debug "[getImage] Getting image data for '#{name}' from remote, using image:", token.image

			if @tokenAttempts[name] >= config.versioning.maxTokenAttempts
				debug "[getImage] Too many failed attempts to renew token. '#{name}' most likely does not exist in the repository"
				return cb null,
					"#{name}":
						versions: []
						access:   false

			request
				url:     @getDockerURL token.image
				headers: @getDockerHeaders token: token.token
			, (error, response, body) =>
				return cb error if error

				debug "[getImage] Request result", body?.toString()

				try
					json = JSON.parse body?.toString()
				catch error
					return cb error

				isUnauthorized = json.errors?[0].code is "UNAUTHORIZED"

				debug "[getImage] Unauthorized:", isUnauthorized

				unless isUnauthorized
					@tokenAttempts[name] = 0
					@cached[json.name]   =
						versions:  json.tags
						cacheTime: Date.now()


					debug "[getImage] Returning",
						"#{name}":
							versions: json.tags or []
							access:   true

					return cb null,
						"#{name}":
							versions: json.tags or []
							access:   true

				debug "[getImage] Unauthorized access to image '#{token.image}', renewing token and trying again!"

				@renewToken token.image, (error) =>
					return cb error if error
					@getImage name, cb

	getImages: (names, cb) ->
		debug "[getImages] Get images", names

		unless Array.isArray names
			error = new Error "Names must be an array of names"
			return cb error if typeof cb is "function"
			throw error

		reduceArrayToKeyValue = (images) ->
			debug "[getImages] Reducing", images
			images.reduce (combined, image) ->
				name = Object.keys(image)[0]

				combined[name] = image[name]
				combined
			, {}

		async.map names, @getImage, (error, images) ->
			return cb error if error

			cb null, reduceArrayToKeyValue images

	getVersions: (filter, cb) ->
		{ matcher, names } = filter

		unless matcher?
			debug "[getVersions] No matcher specified, using wildcard"
			matcher = "*"

		unless names?
			debug "[getVersions] No images specified, using empty array"
			names = []

		debug "[getVersions] Using matcher:", matcher
		debug "[getVersions] Using names:  ", names
		debug "[getVersions] Start get images"

		@getImages names, (error, images) ->
			return cb error if error

			debug "[getVersions] Result get images", _.object (_.keys images), _.map (_.values images), (arr) -> JSON.stringify arr

			versions = {}
			for name, tags of images
				validOnly = tags.filter (tag) -> !!semver.valid tag
				max       = semver.maxSatisfying validOnly, matcher

				versions[name] = max

			debug "[getVersions] versions", versions

			cb null, versions

	getDockerURL: (image) ->
		return null unless image?

		url.format
			protocol: "https"
			host:     @docker.host
			pathname: "v2/#{image}/tags/list"

	getDockerHeaders: ({ token }) ->
		"Authorization": "Bearer #{token}"

	getGitURL: (image) ->
		return null unless image?

		url.format
			protocol: "https"
			host:     @git.host
			pathname: "jwt/auth"
			query:
				client_id:     "docker"
				offline_token: "true"
				service:       "container_registry"
				scope:         "repository:#{image}:push,pull"

	getGitHeaders: ->
		auth =
			username: @docker.username
			password: @docker.password

		b64 = new Buffer("#{auth.username}:#{auth.password}").toString "base64"

		"Authorization": "Basic #{b64}"

module.exports = Versioning
