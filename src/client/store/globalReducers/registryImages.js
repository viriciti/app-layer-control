import { Map, fromJS } from 'immutable'

import { REGISTRY_IMAGES } from './actions'

// ------------------------------------
// Specialized Action Creator
// ------------------------------------
const ACTION_HANDLERS = {
	[REGISTRY_IMAGES]: (state, action) => {
		return Map(fromJS(action.payload))
	},
}
// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function registryImagesReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
