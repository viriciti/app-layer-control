export const DEVICE_NAMESPACE = 'device/'
export const DEVICES_NAMESPACE = 'devices/'
export const DB_NAMESPACE = 'db/'
export const DEVICE_GET_NAMESPACE = 'device:get/'

export const MULTISELECT_DEVICE = 'MULTISELECT_DEVICE'
export const MULTISELECT_DEVICES = 'MULTISELECT_DEVICES'
export const MULTISELECT_ACTION = 'MULTISELECT_ACTION' // type of action to perfom on selected devices // TODO fix naming
export const MULTISELECT_ACTION_CLEAR = 'MULTISELECT_ACTION_CLEAR'

export const ADD_FILTER = 'ADD_FILTER'
export const SET_FILTER = 'SET_FILTER'
export const APPLY_FILTERS = 'APPLY_FILTERS'
export const CLEAR_FILTERS = 'CLEAR_FILTERS'

export const SELECT_DEVICE = 'SELECT_DEVICE'

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
export const REMOVE_GROUP = 'REMOVE_GROUP'

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

export function selectDevice (payload) {
	return {
		type: SELECT_DEVICE,
		payload,
	}
}

export function refreshState (payload) {
	return {
		type: DEVICE_NAMESPACE + REFRESH_STATE,
		payload,
		meta: {
			async:    'isRefreshingState',
			debounce: {
				time: 500,
			},
		},
	}
}

export function rebootDevices (payload) {
	return {
		type: DEVICES_NAMESPACE + REBOOT,
		payload,
	}
}

export function storeGroups (payload) {
	return {
		type: DEVICE_NAMESPACE + STORE_GROUPS,
		payload,
	}
}

export function multiStoreGroups (payload) {
	return {
		type: DEVICES_NAMESPACE + STORE_GROUPS,
		payload,
	}
}

export function removeGroup (payload) {
	return {
		type: DEVICE_NAMESPACE + REMOVE_GROUP,
		payload,
	}
}

export function multiRemoveGroups (payload) {
	return {
		type: DEVICES_NAMESPACE + REMOVE_GROUP,
		payload,
	}
}

export function removeImage (payload) {
	return {
		type: DEVICE_NAMESPACE + REMOVE_IMAGE,
		payload,
	}
}

export function removeContainer (payload) {
	return {
		type: DEVICE_NAMESPACE + REMOVE_CONTAINER,
		payload,
	}
}

export function restartContainer (payload) {
	return {
		type: DEVICE_NAMESPACE + RESTART_CONTAINER,
		payload,
	}
}

export function getContainerLogs (payload) {
	return {
		type: DEVICE_GET_NAMESPACE + GET_CONTAINER_LOGS,
		payload,
	}
}

export function cleanLogs (payload) {
	return {
		type: CLEAN_LOGS,
		payload,
	}
}
