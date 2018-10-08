import { Map, fromJS } from 'immutable'

import {
	DEVICE_STATE,
	DEVICES_BATCH_STATE,
	DEVICES_BATCH_APP_STATE,
	DEVICES_STATE,
	CONTAINER_LOGS,
	SELECT_DEVICE,
} from '../actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[SELECT_DEVICE]: (devices, action) => {
		const newDevices = devices.map(d => {
			return d.set('selected', false)
		})

		if (!action.payload) {
			return newDevices
		}

		return devices.setIn([action.payload.get('deviceId'), 'selected'], true)
	},

	[DEVICES_STATE]: (_, action) => {
		return fromJS(action.data)
	},

	[DEVICES_BATCH_STATE]: (devices, action) => {
		return devices.mergeDeep(fromJS(action.data))
	},

	[DEVICES_BATCH_APP_STATE]: (devices, action) => {
		return devices
			.filter(device => {
				return !!action.data[device.get('deviceId')]
			})
			.map(device => {
				const updatedAppState = fromJS(action.data[device.get('deviceId')])

				return device
					.set('containers', updatedAppState.get('containers'))
					.set('containersNotRunning', updatedAppState.get('containersNotRunning'))
			})
	},

	[DEVICE_STATE]: (devices, action) => {
		const deviceId = action.data.deviceId
		const deviceState = fromJS(action.data)

		return devices.mergeIn([deviceId], deviceState)
	},

	[CONTAINER_LOGS]: (devices, action) => {
		const containerLogs = fromJS({
			[action.data.containerId]: action.data.logs,
		})

		return devices.setIn([action.data.device, 'containerLogs'], containerLogs)
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
