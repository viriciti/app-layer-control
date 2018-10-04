_ = require "underscore"
fs = require "fs"

module.exports = _.reduce (fs.readdirSync "#{__dirname}/external"), (sources, source) ->
	sources[source] = require  "#{__dirname}/external/#{source}"
	sources
, {}
