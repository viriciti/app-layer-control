import { createSelector } from 'reselect'

const getDevices = state => {
	return state.get('devices')
}

const getSelectedDevice = devices => {
	if (devices) {
		return devices
			.filter(device => {
				return device.get('selected')
			})
			.first()
	}
}

export default createSelector(getDevices, getSelectedDevice)
