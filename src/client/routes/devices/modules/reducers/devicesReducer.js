import { Map, fromJS } from 'immutable'

import { DEVICE_STATE, DEVICES_STATE } from '/routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[DEVICES_STATE] (devices, { payload }) {
		return fromJS(payload).reduce(
			(devices, update, deviceId) => devices.mergeIn([deviceId], update).setIn([deviceId, 'deviceId'], deviceId),
			devices
		)
	},

	[DEVICE_STATE] (devices, { payload }) {
		const deviceId    = payload.deviceId
		const deviceState = fromJS(payload)

		return devices.mergeIn([deviceId], deviceState)
	},
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map()
export default function devicesReducer (devices = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(devices, action) : devices
}
