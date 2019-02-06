import { Map, List } from 'immutable'
import { isArray } from 'lodash'

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

const actionHandlers = {
	[SELECT_DEVICE] (state, { payload }) {
		return state.set('selectedDevice', payload)
	},
	[UPDATE_ASYNC_STATE] (state, { payload }) {
		const [name, status] = payload
		return state.set(name, status)
	},
	[UPDATE_DEVICE_ASYNC_STATE] (state, { payload }) {
		const { name, status } = payload
		const target = isArray(payload.target) ? payload.target : [payload.target]
		const currentStatuses = state.get(name, List())

		if (status) {
			return state.set(name, currentStatuses.concat(target))
		} else {
			return state.set(name, currentStatuses.filterNot(device => target.includes(device)))
		}
	}
}

const initialState = Map({
	isFetchingVersions: false,
	isRefreshingState:  List(),
	isStoringGroups:    List(),

	isFetchingApplications: true,
	isFetchingGroups:       true,
	isFetchingRegistry:     true,
})

export default function uiReducer (state = initialState, action) {
	if (actionHandlers[action.type]) {
		return actionHandlers[action.type](state, action)
	} else {
		return state
	}
}
