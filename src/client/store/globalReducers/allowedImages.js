import { List, fromJS } from 'immutable'
import { map } from 'lodash'

import { ALLOWED_IMAGES } from './actions'

const ACTION_HANDLERS = {
	[ALLOWED_IMAGES]: (_, action) => {
		return fromJS(map(action.payload, 'name'))
	},
}

export default function (state = List(), action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
