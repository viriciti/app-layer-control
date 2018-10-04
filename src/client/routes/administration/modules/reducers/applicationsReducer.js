import { Map, fromJS } from 'immutable'

import { APPLICATIONS } from '../actions'

// ------------------------------------
// Specialized Action Creator
// ------------------------------------
const ACTION_HANDLERS = {
	[APPLICATIONS]: (_, action) => {
		return Map(fromJS(action.data))
	},
}
// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function applicationsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
