{ Observable } = require "rxjs"

module.exports = (store) ->
	Observable
		.interval 1000
		.map ->
			store.getCache()
		.distinctUntilChanged()
		.debounceTime 500
