import { createSelector } from 'reselect'
import { Map } from 'immutable'

const devices = state => state.get('devices', Map())
const filter  = state => state.getIn(['ui', 'filter'], '')

const searchIn = ['status', 'systemInfo.tun0', 'updateState.short', 'deviceId', 'systemInfo.appVersion']

export default createSelector(
	[devices, filter],
	(devices, filter) => {
		return devices.filter(device =>
			searchIn.some(field =>
				device
					.getIn(field.split('.'), '')
					.toLowerCase()
					.includes(filter.toLowerCase())
			)
		)
	}
)
