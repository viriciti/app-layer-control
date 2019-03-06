import { Map, fromJS } from 'immutable'

import { APPLICATIONS } from '/routes/administration/modules/actions'

const ACTION_HANDLERS = {
	[APPLICATIONS] (_, action) {
		return fromJS(action.payload)
	},
}

const initialState = Map()

export default function applicationsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
