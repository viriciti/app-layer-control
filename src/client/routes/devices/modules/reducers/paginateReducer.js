import { Map } from 'immutable'

import { PAGINATE, ITEMS_PER_PAGE, APPLY_FILTERS } from '/routes/devices/modules/actions'

const ACTION_HANDLERS = {
	[PAGINATE]: (state, action) => {
		return state.set('page', action.payload)
	},
	[ITEMS_PER_PAGE]: (state, action) => {
		return state.set('itemsPerPage', action.payload).set('page', 0)
	},
	[APPLY_FILTERS]: state => {
		return state.set('page', 0)
	},
}

const initialState = Map({
	page:         0,
	itemsPerPage: 20,
})

export default function paginateReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
