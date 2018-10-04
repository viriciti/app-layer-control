import { Map, fromJS } from 'immutable'

import { ENABLED_REGISTRY_IMAGES } from '../actions'

// ------------------------------------
// Specialized Action Creator
// ------------------------------------
const ACTION_HANDLERS = {
	[ENABLED_REGISTRY_IMAGES]: (_, action) => {
		return Map(fromJS(action.data))
	},
}
// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function enabledRegistryImagesReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
