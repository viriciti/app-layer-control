import { Map, fromJS } from 'immutable'

import { DEVICE_STATE, DEVICES_BATCH_STATE, DEVICES_STATE, CONTAINER_LOGS } from '/routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[DEVICES_STATE]: (_, action) => {
		return fromJS(action.payload)
	},

	[DEVICES_BATCH_STATE]: (devices, action) => {
		return devices.reduce((updatedDevices, device) => {
			const deviceId = device.get('deviceId')

			if (action.payload[deviceId]) {
				return updatedDevices.mergeIn([deviceId], fromJS(action.payload[deviceId]))
			} else {
				return updatedDevices
			}
		}, devices)
	},

	[DEVICE_STATE]: (devices, action) => {
		const deviceId = action.payload.deviceId
		const deviceState = fromJS(action.payload)

		return devices.mergeIn([deviceId], deviceState)
	},

	[CONTAINER_LOGS]: (devices, action) => {
		const containerLogs = fromJS({
			[action.payload.containerId]: action.payload.logs,
		})

		return devices.setIn([action.payload.device, 'containerLogs'], containerLogs)
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
