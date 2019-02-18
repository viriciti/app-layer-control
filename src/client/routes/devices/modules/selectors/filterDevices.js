import { createSelector } from 'reselect'
import { Map } from 'immutable'
import { isString } from 'lodash'

const getDevices = state => state.get('devices', Map())
const getFilter  = state => state.getIn(['ui', 'filter'], '')
const getSources = state =>
	state
		.get('deviceSources', Map())
		.filter(source => source.get('filterable'))
		.keySeq()
		.toList()

export default createSelector(
	[getDevices, getFilter, getSources],
	(devices, filter, sources) =>
		devices.filter(device =>
			sources.some(field => {
				const value = device.getIn(field.split('.'), '')

				if (isString(value)) {
					return value.toLowerCase().includes(filter.toLowerCase())
				} else {
					return false
				}
			})
		)
)
