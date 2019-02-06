import axios from 'axios'
import { get, pick } from 'lodash'
import { toast } from 'react-toastify'

import { DEVICE_SOURCES } from '/store/globalReducers/actions'
import { SELECT_DEVICE } from '/store/constants'
import { updateDeviceAsyncState } from '/store/globalReducers/ui'

export const MULTISELECT_DEVICE = 'MULTISELECT_DEVICE'
export const MULTISELECT_DEVICES = 'MULTISELECT_DEVICES'
export const MULTISELECT_ACTION = 'MULTISELECT_ACTION' // type of action to perfom on selected devices // TODO fix naming
export const MULTISELECT_ACTION_CLEAR = 'MULTISELECT_ACTION_CLEAR'

export const ADD_FILTER = 'ADD_FILTER'
export const SET_FILTER = 'SET_FILTER'
export const APPLY_FILTERS = 'APPLY_FILTERS'
export const CLEAR_FILTERS = 'CLEAR_FILTERS'

export const DEVICE_STATE = 'DEVICE_STATE'
export const DEVICES_STATE = 'DEVICES_STATE'
export const DEVICES_BATCH_STATE = 'DEVICES_BATCH_STATE'
export const DEVICE_STATUS = 'DEVICE_STATUS'
export const DEVICES_STATUS = 'DEVICES_STATUS'
export const REFRESH_STATE = 'REFRESH_STATE'
export const REBOOT = 'REBOOT'

export const REMOVE_CONTAINER = 'REMOVE_CONTAINER'
export const RESTART_CONTAINER = 'RESTART_CONTAINER'
export const GET_CONTAINER_LOGS = 'GET_CONTAINER_LOGS'
export const CONTAINER_LOGS = 'CONTAINER_LOGS'

export const REMOVE_IMAGE = 'REMOVE_IMAGE'

export const STORE_GROUPS = 'STORE_GROUPS'
export const REMOVE_GROUP = 'REMOVE_DEVICE_GROUP'

export const CLEAN_LOGS = 'CLEAN_LOGS'
export const DEVICE_LOGS = 'DEVICE_LOGS'

export const PAGINATE = 'PAGINATE'
export const ITEMS_PER_PAGE = 'ITEMS_PER_PAGE'
export const RESET_PAGINATION = 'RESET_PAGINATION'

export function addFilter (payload) {
	return {
		type: ADD_FILTER,
		payload,
	}
}

export function setFilter (payload) {
	return {
		type: SET_FILTER,
		payload,
	}
}

export function clearFilters () {
	return {
		type: CLEAR_FILTERS,
	}
}

export function applyFilters () {
	return {
		type: APPLY_FILTERS,
	}
}

export function paginateTo ({ selected }) {
	return {
		type:    PAGINATE,
		payload: selected,
	}
}

export function setItemsPerPage (payload) {
	return {
		type: ITEMS_PER_PAGE,
		payload,
	}
}

export function resetPagination () {
	return {
		type: RESET_PAGINATION,
	}
}

export function multiSelectDevice (payload) {
	return {
		type: MULTISELECT_DEVICE,
		payload,
	}
}

export function multiSelectDevices (payload) {
	return {
		type: MULTISELECT_DEVICES,
		payload,
	}
}

export function multiSelectAction (payload) {
	return {
		type: MULTISELECT_ACTION,
		payload,
	}
}

export function clearMultiSelect () {
	return {
		type: MULTISELECT_ACTION_CLEAR,
	}
}

export function selectDevice (deviceId) {
	return {
		type:    SELECT_DEVICE,
		payload: deviceId,
	}
}

export function cleanLogs (payload) {
	return {
		type: CLEAN_LOGS,
		payload,
	}
}

export function asyncRestartApplication (deviceId, application) {
	const id = [deviceId, application].join('|')

	return async dispatch => {
		dispatch(updateDeviceAsyncState('isRestartingApplication', id, true))

		try {
			const { data } = await axios.put(`/api/devices/${deviceId}/restart/${application}`)

			toast.success(data.message)
		} catch ({ response }) {
			toast.error(response.data.message)
		} finally {
			dispatch(updateDeviceAsyncState('isRestartingApplication', id, false))
		}
	}
}

export function asyncRemoveApplication (deviceId, application) {
	const id = [deviceId, application].join('|')

	return async dispatch => {
		dispatch(updateDeviceAsyncState('isRemovingApplication', id, true))

		try {
			const { data } = await axios.delete(`/api/devices/${deviceId}/${application}`)

			toast.success(data.message)
		} catch ({ response }) {
			toast.error(response.data.message)
		} finally {
			dispatch(updateDeviceAsyncState('isRemovingApplication', id, false))
		}
	}
}

export function asyncRefreshState (deviceId) {
	return async dispatch => {
		dispatch(updateDeviceAsyncState('isRefreshingState', deviceId, true))

		try {
			const { data } = await axios.put(`/api/devices/${deviceId}/state`)

			toast.success(data.message)
		} catch ({ response }) {
			toast.error(response.data.message)
		} finally {
			dispatch(updateDeviceAsyncState('isRefreshingState', deviceId, false))
		}
	}
}

export function fetchApplicationLogs (deviceId, application) {
	const id = [deviceId, application].join('|')

	return async dispatch => {
		dispatch(updateDeviceAsyncState('isFetchingLogs', id, true))

		try {
			const { data } = await axios.get(`/api/devices/${deviceId}/logs/${application}`)

			dispatch({
				type:    CONTAINER_LOGS,
				payload: data.data,
				meta:    {
					deviceId: deviceId,
					name:     application,
				},
			})

			toast.success(data.message)
		} catch ({ response }) {
			toast.error(response.data.message)
		} finally {
			dispatch(updateDeviceAsyncState('isFetchingLogs', id, false))
		}
	}
}

export function fetchDevices () {
	return async dispatch =>
		dispatch({
			type:    DEVICES_STATE,
			payload: get(await axios.get('/api/devices'), 'data.data'),
		})
}

export function fetchSources () {
	return async dispatch =>
		dispatch({
			type:    DEVICE_SOURCES,
			payload: get(await axios.get('/api/v1/administration/sources'), 'data.data'),
		})
}
