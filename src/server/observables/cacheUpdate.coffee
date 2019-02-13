{ Observable } = require "rxjs"

module.exports = (store) ->
	Observable
		.interval 1000
		.map ->
			store.getAll()
		.distinctUntilChanged (prev, next) ->
			next.equals prev
		.debounceTime 500
