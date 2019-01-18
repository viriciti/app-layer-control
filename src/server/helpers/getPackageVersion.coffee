fs            = require "fs"
path          = require "path"
{ promisify } = require "util"

maxDepth = 5
version  = undefined

getPackageVersion = (directory, depth = 0) ->
	return version if version

	directory or= ""
	directory   = path.resolve directory
	files       = await promisify(fs.readdir) directory
	parent      = path.resolve directory, ".."

	if depth >= maxDepth
		throw new Error "Max depth reached for finding 'package.json': #{maxDepth}"

	if files.includes "package.json"
		pkgLocation = path.join directory, "package.json"
		{ version } = require pkgLocation

		return version

	getPackageVersion parent, depth + 1

module.exports = getPackageVersion
