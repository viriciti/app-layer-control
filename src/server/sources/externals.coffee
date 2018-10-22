fs    = require "fs"
path  = require "path"
log   = (require "../lib/Logger") "externals"

directory = path.join __dirname, "externals"

try
	files   = fs.readdirSync directory
	sources = files
		.filter (file) -> file.match /(\.js|\.coffee)$/
		.map    (file) -> require path.join directory, file

	if sources.length
		log.info "#{sources.length} external source(s) found"
	else
		log.warn "No external sources found"

	module.exports = sources
catch error
	if error.code is "ENOENT"
		log.warn "Could not find directory #{directory}"
		module.exports = {}
	else
		throw error
