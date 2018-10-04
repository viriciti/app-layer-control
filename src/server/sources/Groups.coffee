{ Observable } = require "rxjs"

module.exports = (socket) ->
	Observable.fromEvent socket, "global/collections/groups"
