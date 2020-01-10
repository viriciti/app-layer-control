import { List, Map } from 'immutable'
import { isString, isEmpty } from 'lodash'
import createImmutableSelector from '/store/createImmutableSelector'

const getDevices = state => state.get('devices', Map())
const getFilter  = state => state.getIn(['ui', 'filter'], [])
const getSort    = state => state.getIn(['ui', 'sort'])
const getInvert  = state => state.getIn(['ui', 'invert'], false)
const getSources = state =>
	state
		.get('deviceSources', List())
		.filter(source => source.get('filterable'))
		.map(source => source.get('getIn'))

function valueIncludes (value, filter) {
	return value.toLowerCase().includes(filter.toLowerCase())
}

export default createImmutableSelector(
	[getDevices, getFilter, getSort, getInvert, getSources],
	(devices, filter, sort, invert, sources) => {
		const containsEveryFilter = device =>
			filter.every(({ name: query }) =>
				// Even though every tag must be
				// present in the device's state,
				// it is not required for a single tag
				// to be present in every filterable field.
				sources.some(field => {
					const value = device.getIn(field.split('.'), '')

					// Patch: status is not saved as a string, but as a boolean
					// All paths are exhausted, we do not have to add a final return
					if (['online', 'offline'].includes(query)) {
						if (query === 'online') {
							return device.get('connected') === true
						} else if (query === 'offline') {
							return device.get('connected') === false
						}
					}

					if (isString(value)) {
						// Handle fields whose value is a string
						return valueIncludes(value, query)
					} else if (List.isList(value)) {
						// Handle fields whose value is a List
						// If any of the values match the tag,
						// the device is included in the search.
						//
						// Currently supports Lists with string values
						// List[Map], List[List] and such are not suppported
						return value.some(item => (isString(item) ? valueIncludes(item, query) : false))
					} else {
						return false
					}
				})
			) // eslint-disable-line no-mixed-spaces-and-tabs

		devices = devices
			.filter(device =>
				isEmpty(filter) ? true : invert ? !containsEveryFilter(device) : containsEveryFilter(device)
			)
			.sortBy(device => device.getIn(sort.get('field').split('.'), ''))
			.sortBy(device => !device.has('connected'))

		return sort.get('ascending') ? devices : devices.reverse()
	}
)
