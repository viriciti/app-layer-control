import { Map, fromJS } from 'immutable'

import { CONFIGURATIONS } from '/routes/administration/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[CONFIGURATIONS]: (_, action) => {
		return Map(fromJS(action.data))
	},
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function configurationsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
