import { createSelector } from 'reselect'

const getDevices        = state => state.get('devices')
const getSelectedDevice = state => state.getIn(['ui', 'selectedDevice'])

export default createSelector(
	[getDevices, getSelectedDevice],
	(devices, selectedDevice) => devices.get(selectedDevice)
)
