import { createSelector } from 'reselect'

const getDevices = state => {
	return state.get('devices')
}

const getSelectedDevice = state => {
	return state.getIn(['userInterface', 'selectedDevice'])
}

const getDevice = (devices, selectedDevice) => {
	if (selectedDevice) {
		return devices.get(selectedDevice)
	} else {
		return undefined
	}
}

export default createSelector(
	[getDevices, getSelectedDevice],
	getDevice
)
