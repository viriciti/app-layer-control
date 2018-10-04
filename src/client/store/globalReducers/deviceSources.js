import { Map, fromJS } from 'immutable'

import { DEVICE_SOURCES } from './actions'

const ACTION_HANDLERS = {
	[DEVICE_SOURCES]: (_, action) => {
		return fromJS(action.data).sortBy(column => {
			return column.get('columnIndex')
		})
	},
}

export default function (state = Map(), action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
