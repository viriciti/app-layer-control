import { Map, fromJS } from 'immutable'

import { GROUPS } from 'routes/administration/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[GROUPS]: (state, action) => {
		return Map(fromJS(action.data))
	},
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function groupsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
