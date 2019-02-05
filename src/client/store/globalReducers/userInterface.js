import { Map, List } from 'immutable'
import { isArray, reject } from 'lodash'

import { UPDATE_ASYNC_STATE, UPDATE_DEVICE_ASYNC_STATE } from '/store/globalReducers/actions'
import { SELECT_DEVICE } from '/store/constants'

export function updateAsyncState (name, status) {
	return {
		type:    UPDATE_ASYNC_STATE,
		payload: [name, status],
	}
}

export function updateDeviceAsyncState (name, target, status) {
	return {
		type:    UPDATE_DEVICE_ASYNC_STATE,
		payload: {
			name,
			status,
			target,
		},
	}
}

// ------------------------------------
// Specialized Action Creator
// ------------------------------------
const ACTION_HANDLERS = {
	[SELECT_DEVICE] (state, action) {
		return state.set('selectedDevice', action.payload)
	},
	[UPDATE_ASYNC_STATE] (state, action) {
		const [name, status] = action.payload
		return state.set(name, status)
	},
	[UPDATE_DEVICE_ASYNC_STATE] (state, action) {
		const { name, status } = action.payload
		const target = isArray(action.payload.target) ? action.payload.target : [action.payload.target]
		const currentStatuses = state.get(name, List())

		if (status) {
			return state.set(name, currentStatuses.concat(target))
		} else {
			return state.set(name, currentStatuses.filterNot(device => target.includes(device)))
		}
	},
}

const initialState = Map({
	isFetchingVersions: false,
	isRefreshingState:  List(),
	isStoringGroups:    List(),

	isFetchingApplications: true,
	isFetchingGroups:       true,
	isFetchingRegistry:     true,
})

export default function userInterfaceReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
