export const DB_NAMESPACE = 'db/'
export const EDIT_COLUMN = 'EDIT_COLUMN'
export const ADD_COLUMN = 'ADD_COLUMN'
export const REMOVE_COLUMN = 'REMOVE_COLUMN'

export function editColumn (name, payload) {
	return {
		type: DB_NAMESPACE + EDIT_COLUMN,
		payload,
		meta: {
			name,
		},
	}
}

export function addColumn (payload) {
	return {
		type: DB_NAMESPACE + ADD_COLUMN,
		payload,
	}
}

export function removeColumn (name) {
	return {
		type: DB_NAMESPACE + REMOVE_COLUMN,
		meta: {
			name,
		},
	}
}
