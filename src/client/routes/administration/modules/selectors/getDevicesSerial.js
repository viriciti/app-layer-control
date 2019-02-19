import { createSelector } from 'reselect'

const devices = state => {
	return state.get('devices')
}

const getDevicesSerial = devices => {
	return devices.keySeq()
}

export default createSelector(
	devices,
	getDevicesSerial
)
