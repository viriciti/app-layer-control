import { List, Map } from 'immutable'
import { isString } from 'lodash'
import createImmutableSelector from '/store/createImmutableSelector'

const getDevices = state => state.get('devices', Map())
const getFilter  = state => state.getIn(['ui', 'filter'], '')
const getSort    = state => state.getIn(['ui', 'sort'])
const getSources = state =>
	state
		.get('deviceSources', List())
		.filter(source => source.get('filterable'))
		.map(source => source.get('getIn'))

export default createImmutableSelector(
	[getDevices, getFilter, getSort, getSources],
	(devices, filter, sort, sources) => {
		const devicesWithMutations = devices
			.filter(
				device =>
					device.has('connected') &&
					device.has('deviceId') &&
					sources.some(field => {
						const value = device.getIn(field.split('.'), '')

						if (isString(value)) {
							return value.toLowerCase().includes(filter.toLowerCase())
						} else {
							return false
						}
					})
			)
			.sortBy(device => device.getIn(sort.get('field').split('.'), ''))

		return sort.get('ascending') ? devicesWithMutations : devicesWithMutations.reverse()
	}
)
