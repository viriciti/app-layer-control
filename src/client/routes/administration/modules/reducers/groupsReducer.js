import { Map, fromJS } from 'immutable'

import { GROUPS } from '/routes/administration/modules/actions'

const ACTION_HANDLERS = {
	[GROUPS] (_, action) {
		return fromJS(action.payload)
	},
}

const initialState = Map()
export default function groupsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
