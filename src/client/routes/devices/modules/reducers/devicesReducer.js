import { Map, fromJS } from 'immutable'

import { DEVICE_STATE, DEVICES_BATCH_STATE, DEVICES_STATE } from '/routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[DEVICES_STATE]: (_, { payload }) => {
		return fromJS(payload)
	},

	[DEVICES_BATCH_STATE]: (devices, { payload }) => {
		return devices.reduce((updatedDevices, device) => {
			const deviceId = device.get('deviceId')

			if (payload[deviceId]) {
				return updatedDevices.mergeIn([deviceId], fromJS(payload[deviceId]))
			} else {
				return updatedDevices
			}
		}, devices)
	},

	[DEVICE_STATE]: (devices, { payload }) => {
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
