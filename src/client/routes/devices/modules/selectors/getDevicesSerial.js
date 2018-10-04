import { createSelector } from 'reselect'
import { List } from 'immutable'

const getDevices = state => {
	return state.get('devices')
}

const getDevicesSerial = devices => {
	if (!devices) {
		return List()
	} else {
		return devices
			.map(device => {
				return device.get('deviceId')
			})
			.valueSeq()
	}
}

export default createSelector(getDevices, getDevicesSerial)
