import { createSelector } from 'reselect'

import getDevices from '/routes/devices/selectors/getDevices'
import getSelectedDevice from '/routes/devices/selectors/getSelectedDevice'
import { fromJS } from 'immutable'

export default createSelector(
	[getDevices, getSelectedDevice],
	(devices, selectedDevice) => {
		if (!selectedDevice) {
			return null
		} else {
			const deviceIds = devices.keySeq().toList()
			const index     = deviceIds.indexOf(selectedDevice.get('deviceId'))
			const previous  = index > 0 ? deviceIds.get(index - 1) : null
			const next      = index + 1 >= deviceIds.size ? null : deviceIds.get(index + 1)

			return fromJS({ previous, next })
		}
	}
)
