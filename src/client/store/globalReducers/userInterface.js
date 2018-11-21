import { Map } from 'immutable'

import { UPDATE_ASYNC_STATE } from './actions'

export function updateAsyncState (name, status) {
	return {
		type:    UPDATE_ASYNC_STATE,
		payload: [name, status],
	}
}

// ------------------------------------
// Specialized Action Creator
// ------------------------------------
const ACTION_HANDLERS = {
	[UPDATE_ASYNC_STATE]: (state, action) => {
		const [name, status] = action.payload
		return state.set(name, status)
	},
}

const initialState = Map({ isFetchingVersions: false })

export default function registryImagesReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
