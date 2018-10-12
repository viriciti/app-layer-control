import { createSelector } from 'reselect'
import { Map } from 'immutable'

const getDevices = state => {
	return state.get('devices')
}

const getGroups = state => {
	return state.get('groups')
}

export default createSelector([getDevices, getGroups], (devices, groups) => {
	return groups.reduce((counts, _, name) => {
		return counts.set(
			name,
			devices.filter(device => {
				return device
					.get('groups')
					.toArray()
					.includes(name)
			}).size
		)
	}, Map())
})
