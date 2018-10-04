import { applyMiddleware, compose, createStore } from 'redux'

import thunk from 'redux-thunk'
import { Map } from 'immutable'
import createDebounce from 'redux-debounced'
import socketIOMiddleware from './middlewares/socket.io-middleware'

import makeRootReducer from './reducers'

export default (initialState = Map({})) => {
	// ======================================================
	// Middleware Configuration
	// ======================================================
	const middleware = [createDebounce(), thunk, socketIOMiddleware]

	// ======================================================
	// Store Enhancers
	// ======================================================
	const enhancers = []

	let composeEnhancers = compose

	if (process.env.NODE_ENV !== 'production') {
		const composeWithDevToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		if (typeof composeWithDevToolsExtension === 'function') {
			composeEnhancers = composeWithDevToolsExtension
		}
	}

	const store = createStore(
		makeRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(...middleware), ...enhancers)
	)
	store.asyncReducers = {}

	if (module.hot) {
		module.hot.accept('./reducers', () => {
			const reducers = require('./reducers').default
			store.replaceReducer(reducers(store.asyncReducers))
		})
	}

	return store
}
