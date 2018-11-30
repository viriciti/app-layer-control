{ chain, reduce } = require "underscore"
semver            = require "semver"
config            = require "config"

Versioning         = require "../lib/Versioning"
prependRegistryUrl = require "../helpers/prependRegistryUrl"

versioning = new Versioning config.versioning

module.exports = (images, cb) ->
	versioning.getImages images, (error, result) ->
		return cb error if error

		cb null, reduce result, (memo, { versions, access, exists }, imageName) ->
			versions = chain versions
				.without "latest", "1"
				.sort (left, right) ->
					return -1 unless semver.valid left
					return 1  unless semver.valid right
					semver.compare left, right
				.value()

			memo[prependRegistryUrl imageName] = { versions, access, exists }
			memo
		, {}
