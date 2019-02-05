import { Map, List, fromJS } from 'immutable'

import { DEVICE_LOGS, CLEAN_LOGS } from '/routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[DEVICE_LOGS]: (state, action) => {
		// state is an object with all deviceIds each containing an array of logs
		// action contains the type of action 'DEVICE_LOGS' and a logs object { message, time, type }

		const { deviceId, logs } = action.payload
		let logsArrayForDevice = state.get(deviceId)

		// Create the initial immutable list for this device if it does not exist yet
		if (!logsArrayForDevice) {
			return state.set(deviceId, List().push(fromJS(logs)))
		}

		logsArrayForDevice = logsArrayForDevice.push(fromJS(logs))

		// Don't allow very long list
		if (logsArrayForDevice.size >= 20) {
			logsArrayForDevice = logsArrayForDevice.shift()
		}

		return state.set(deviceId, logsArrayForDevice)
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
