_    = require "underscore"
fs   = require "fs"
path = require "path"

directory = path.join __dirname, "external"

try
	module.exports = _.reduce (fs.readdirSync directory), (sources, source) ->
		sources[source] = require path.join directory, source
		sources
	, {}
catch error
	if error.code is "ENOENT"
		module.exports = {}
	else
		throw error
