import { Map, List } from 'immutable'
import { isArray, partial, eq } from 'lodash'

import { UPDATE_ASYNC_STATE, UPDATE_DEVICE_ACTIVITY } from '/store/globalReducers/actions'
import { SELECT_DEVICE, UPDATE_APPLICATION_ACTIVITY } from '/store/constants'

export function updateAsyncState (name, status) {
	return {
		type:    UPDATE_ASYNC_STATE,
		payload: [name, status],
	}
}

export function updateDeviceActivity (name, target, status) {
	return {
		type:    UPDATE_DEVICE_ACTIVITY,
		payload: {
			name,
			status,
			target,
		},
	}
}

export function updateApplicationActivity ({ name, deviceId, status, application }) {
	return {
		type:    UPDATE_APPLICATION_ACTIVITY,
		payload: status,
		meta:    {
			application,
			name,
			deviceId,
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
	[UPDATE_DEVICE_ACTIVITY] (state, { payload }) {
		const { name, status } = payload
		const target           = isArray(payload.target) ? payload.target : [payload.target]
		const currentStatuses  = state.get(name, List())

		if (status) {
			return state.set(name, currentStatuses.concat(target))
		} else {
			return state.set(name, currentStatuses.filterNot(device => target.includes(device)))
		}
	},
	[UPDATE_APPLICATION_ACTIVITY] (state, { payload, meta }) {
		const { name, application, deviceId } = meta
		const currentStatuses                 = state.getIn([name, deviceId], List())

		if (payload) {
			return state.setIn([name, deviceId], currentStatuses.push(application))
		} else {
			return state.setIn([name, deviceId], currentStatuses.filterNot(partial(eq, application)))
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

export default function uiReducer (state = initialState, action) {
	if (actionHandlers[action.type]) {
		return actionHandlers[action.type](state, action)
	} else {
		return state
	}
}
