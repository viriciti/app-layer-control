import { createSelector } from 'reselect'
import { isEmpty } from 'lodash'
import { Iterable, Map } from 'immutable'

const getFilters = state => {
	return state.getIn(['filters', 'columns'], Map())
}

export default createSelector([getFilters], filters => {
	return filters.every(filter => {
		return Iterable.isIterable(filter.get('value')) ? filter.get('value').isEmpty() : isEmpty(filter.get('value'))
	})
})
