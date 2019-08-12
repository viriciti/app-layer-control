import createDebounce from 'redux-debounced'
import thunk from 'redux-thunk'
import { Map } from 'immutable'
import { applyMiddleware, compose, createStore } from 'redux'

import ws from '/store/middleware/ws'
import makeRootReducer from '/store/reducers'

export default (initialState = Map({})) => {
	const protocol   = window.location.protocol.startsWith('https') ? 'wss' : 'ws'
	const middleware = [
		createDebounce(),
		thunk,
		ws(new WebSocket(`${protocol}://${window.location.host}`)),
	]
	const enhancers  = []

	let composeEnhancers = compose

	if (process.env.NODE_ENV !== 'production') {
		const composeWithDevToolsExtension =
			window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__

		if (typeof composeWithDevToolsExtension === 'function') {
			composeEnhancers = composeWithDevToolsExtension({
				maxAge:           15,
				actionsBlacklist: [
					'@@redux-form/BLUR',
					'@@redux-form/CHANGE',
					'@@redux-form/DESTROY',
					'@@redux-form/FOCUS',
					'@@redux-form/INITIALIZE',
					'@@redux-form/REGISTER_FIELD',
					'@@redux-form/RESET',
					'@@redux-form/SET_SUBMIT_SUCCEEDED',
					'@@redux-form/START_SUBMIT',
					'@@redux-form/STOP_SUBMIT',
					'@@redux-form/TOUCH',
					'@@redux-form/UNREGISTER_FIELD',
					'@@redux-form/UPDATE_SYNC_ERRORS',
				],
			})
		}
	}

	const store = createStore(
		makeRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(...middleware), ...enhancers)
	)

	store.asyncReducers = {}

	if (module.hot) {
		module.hot.accept(() => {
			const reducers = require('./reducers').default
			store.replaceReducer(reducers(store.asyncReducers))
		})
	}

	return store
}
