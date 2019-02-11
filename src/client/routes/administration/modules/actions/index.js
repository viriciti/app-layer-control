import axios from 'axios'
import { get } from 'lodash'
import { Promise } from 'q'
import { REGISTRY_IMAGES, ALLOWED_IMAGES } from '/store/globalReducers/actions'
import { updateAsyncState } from '/store/globalReducers/ui'
import { toast } from 'react-toastify'

export const CONFIGURATIONS = 'CONFIGURATIONS'
export const CREATE_CONFIGURATION = 'CREATE_CONFIGURATION'
export const CONFIGURATION_SELECTED = 'CONFIGURATION_SELECTED'
export const STORE_CONFIGURATION = 'STORE_CONFIGURATION'
export const REMOVE_CONFIGURATION = 'REMOVE_CONFIGURATION'
export const APPLICATIONS = 'APPLICATIONS'

export const REFRESH_REGISTRY_IMAGES = 'REFRESH_REGISTRY_IMAGES'
export const ADD_REGISTRY_IMAGE = 'ADD_REGISTRY_IMAGE'
export const REMOVE_REGISTRY_IMAGE = 'REMOVE_REGISTRY_IMAGE'

export const CREATE_GROUP = 'CREATE_GROUP'
export const GROUPS = 'GROUPS'
export const REMOVE_GROUP = 'REMOVE_GROUP'
export const STORE_GROUP = 'STORE_GROUP'

export function configurationSelected (configuration) {
	return {
		type:    CONFIGURATION_SELECTED,
		payload: configuration,
	}
}

export function asyncRemoveGroup (label) {
	return async dispatch => {
		dispatch(updateAsyncState('isRemovingGroup', true))

		const { status } = await axios.delete(`/api/v1/administration/group/${label}`)
		if (status === 204) {
			toast.success('Group deleted')
		}

		dispatch(updateAsyncState('isRemovingGroup', true))
	}
}

export function fetchApplications () {
	return async dispatch => {
		dispatch(updateAsyncState('isFetchingApplications', true))
		dispatch({
			type:    CONFIGURATIONS,
			payload: get(await axios.get('/api/v1/administration/applications'), 'data.data'),
		})
		dispatch(updateAsyncState('isFetchingApplications', false))
	}
}

export function fetchGroups () {
	return async dispatch => {
		dispatch(updateAsyncState('isFetchingGroups', true))
		dispatch({
			type:    GROUPS,
			payload: get(await axios.get('/api/v1/administration/groups'), 'data.data'),
		})
		dispatch(updateAsyncState('isFetchingGroups', false))
	}
}

export function fetchRegistry () {
	return async dispatch => {
		dispatch(updateAsyncState('isFetchingRegistry', true))

		const [images, allowed] = await Promise.all([
			axios.get('/api/v1/administration/registry?only=images'),
			axios.get('/api/v1/administration/registry?only=allowed'),
		])

		dispatch({
			type:    REGISTRY_IMAGES,
			payload: get(images, 'data.data'),
		})
		dispatch({
			type:    ALLOWED_IMAGES,
			payload: get(allowed, 'data.data'),
		})
		dispatch(updateAsyncState('isFetchingRegistry', false))
	}
}
