import { createSelector } from 'reselect'

const getDevices = state => {
	return state.get('devices')
}

const getContainersVersion = devices => {
	let containersPerDevice = {}

	devices.forEach(device => {
		let containers = {}

		if (!device.has('containers')) {
			return {}
		}

		device.get('containers').forEach(container => {
			const version = container.get('image').split(':')[1] || ''
			const id = container.get('name')

			containers = Object.assign({}, containers, { [id]: version })
		})

		containersPerDevice = Object.assign({}, containersPerDevice, { [device.get('deviceId')]: containers })
	})

	return containersPerDevice
}

export default createSelector(getDevices, getContainersVersion)
