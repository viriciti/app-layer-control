import { createSelector } from 'reselect'
import { Map, List } from 'immutable'

const devices = state => {
	return state.get('devices')
}

// Active filters only change when we dispatch the apply filter action. This way we can debounce filtering
const activeFilters = state => {
	return state.getIn(['filters', 'appliedFilters'])
}

export default createSelector([devices, activeFilters], (devices = Map(), activeFilters = Map()) => {
	if (!activeFilters.size) return devices

	return devices.filter(device => {
		return activeFilters.every((filter, key) => {
			const getIn = key.split('.')
			let predicate = filter.get('value', '')
			let value = device.getIn(getIn, '')

			if (List.isList(value)) {
				value = value.join(', ')
			} else if (Map.isMap(value)) {
				return predicate.some(p => {
					return value.get(p, '').length
				})
			}

			value = value.toLowerCase()

			if (List.isList(predicate)) {
				return predicate.some(p => {
					return value.includes(p.toLowerCase())
				})
			}

			predicate = predicate.toLowerCase()

			return value.includes(predicate)
		})
	})
})
