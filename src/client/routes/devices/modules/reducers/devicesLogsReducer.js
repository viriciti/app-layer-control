import { Map, List, fromJS } from 'immutable'

import { DEVICE_LOGS, CONTAINER_LOGS, CLEAN_LOGS } from '/routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[DEVICE_LOGS] (state, { payload }) {
		const { deviceId, logs } = payload

		return state.setIn(
			[deviceId, 'self'],
			state
				.getIn([deviceId, 'self'], List())
				.push(fromJS(logs))
				.slice(0, 20)
		)
	},

	[CONTAINER_LOGS] (state, { payload, meta }) {
		const { deviceId, name } = meta

		return state.setIn([deviceId, 'containers', name], List(payload))
	},

	[CLEAN_LOGS]: (state, action) => {
		return state.delete(action.payload)
	},
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function deviceLogsReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
