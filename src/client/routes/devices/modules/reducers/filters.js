import { isEmpty, defaultTo } from 'lodash'
import { Map, List, fromJS } from 'immutable'

import { ADD_FILTER, SET_FILTER, CLEAR_FILTERS, APPLY_FILTERS } from '/routes/devices/modules/actions'

import { DEVICE_SOURCES } from '/store/globalReducers/actions'

const ACTION_HANDLERS = {
	[DEVICE_SOURCES]: (filters = Map(), action) => {
		let columns = fromJS(action.payload)

		columns = columns
			.filter(column => {
				return column.get('filterable')
			})
			.reduce((acc, column) => {
				const key           = column.get('getIn')
				const fallbackGetIn = column.get('fallbackGetIn')
				const headerName    = column.get('headerName', 'NO HEADERNAME')
				const filterFormat  = column.get('filterFormat')

				const f = { headerName, filterFormat, value: '' }
				return acc.set(defaultTo(key, fallbackGetIn), Map(f))
			}, Map())

		return filters.mergeIn(['columns'], columns)
	},

	// Adds a filter element
	[ADD_FILTER]: (filters = Map(), action) => {
		const { payload }    = action
		const { columnName } = payload
		filters              = filters.setIn(['columns', columnName], Map())
		return filters
	},

	// Sets a filter element to a value. A selector will pick this up and do the filtering
	[SET_FILTER]: (filters = Map(), action) => {
		const { payload }    = action
		const { key, value } = payload
		return filters.setIn(['columns', key, 'value'], value)
	},

	// We use an apply filters action to be able to debounce the selectors filtering
	[APPLY_FILTERS]: (filters = Map()) => {
		return filters.set(
			'appliedFilters',
			filters.get('columns', Map()).filter((filter, columnName) => {
				const val = filter.get('value')
				if (isEmpty(val)) return false
				if (List.isList(val) && val.size === 0) return false
				return true
			})
		)
	},

	// Clear all the filters
	[CLEAR_FILTERS]: (filters = Map()) => {
		let columns = filters.get('columns', Map())
		columns     = columns.map(filter => {
			return filter.set('value', '')
		})
		return filters.set('columns', columns)
	},
}

export default function (filters = Map(), action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(filters, action) : filters
}
