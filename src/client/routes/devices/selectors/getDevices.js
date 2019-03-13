import { List, Map } from 'immutable'
import { isString, isEmpty, stubTrue } from 'lodash'
import createImmutableSelector from '/store/createImmutableSelector'

const getDevices = state => state.get('devices', Map())
const getFilter  = state => state.getIn(['ui', 'filter'], [])
const getSort    = state => state.getIn(['ui', 'sort'])
const getSources = state =>
	state
		.get('deviceSources', List())
		.filter(source => source.get('filterable'))
		.map(source => source.get('getIn'))

function valueIncludes (value, filter) {
	return value.toLowerCase().includes(filter.toLowerCase())
}

export default createImmutableSelector(
	[getDevices, getFilter, getSort, getSources],
	(devices, filter, sort, sources) => {
		const containsEveryFilter = device =>
			isEmpty(filter)
				? stubTrue
				: filter.every(({ name: query }) =>
					sources.some(field => {
						const value = device.getIn(field.split('.'), '')

						if (isString(value)) {
							return valueIncludes(value, query)
						} else if (List.isList(value)) {
							return value.some(item =>
								isString(item) ? valueIncludes(item, query) : false
							)
						} else {
							return false
						}
					})
				  )
		const devicesWithMutations = devices
			.filter(
				device =>
					device.has('connected') &&
					device.has('deviceId') &&
					containsEveryFilter(device)
			)
			.sortBy(device => device.getIn(sort.get('field').split('.'), ''))

		return sort.get('ascending')
			? devicesWithMutations
			: devicesWithMutations.reverse()
	}
)
