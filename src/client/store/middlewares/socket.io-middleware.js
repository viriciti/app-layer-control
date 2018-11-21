import io from 'socket.io-client'
import camelCase from 'camel-case'
import decamelize from 'decamelize'
import { toast } from 'react-toastify'

import { updateAsyncState } from '../globalReducers/userInterface'

const socket = io(window.location.origin)

export default function ({ dispatch }) {
	const notify = (type, ...message) => {
		toast(message.join(' '), { type })
	}

	const _handleActionsToDevices = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		socket.emit('action:devices', actionToDispatch, (error, result) => {
			if (error) {
				return notify('error', error.message)
			}

			notify('success', `✓ Action executed correctly on ${dest.length} devices`)
		})

		return next(action)
	}

	const _handleActionsToDb = (action, next) => {
		const actionToDispatch = {
			action:  camelCase(action.type.split('/')[1]),
			payload: action.payload,
			meta:    action.meta,
		}

		if (action.meta && action.meta.async) {
			dispatch(updateAsyncState(action.meta.async, true))
		}

		socket.emit('action:db', actionToDispatch, error => {
			const { meta } = actionToDispatch

			if (meta && meta.async) {
				dispatch(updateAsyncState(meta.async, false))
			}

			if (error) {
				return notify('error', error.message)
			}

			notify('success', `✓ Done`)
		})

		return next(action)
	}

	const _handleActionsToDevice = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		socket.emit('action:device', actionToDispatch, (error, result) => {
			if (error) {
				return notify('error', error.message)
			}

			if (!result) return

			if (result.timeout) {
				return notify('warning', `Timed out: ${JSON.stringify(result.timeout)}`)
			}
			if (result.data) {
				return notify('success', `Timed out: ${JSON.stringify(result.data)}`)
			}
		})

		return next(action)
	}

	const _handleGetActionsToDevice = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		socket.emit('action:device:get', actionToDispatch, (error, result) => {
			if (error) {
				return notify('error', error.message)
			}

			if (actionToDispatch.action === 'getContainerLogs') {
				dispatch({
					type: 'CONTAINER_LOGS',
					data: {
						logs:        result.data,
						device:      actionToDispatch.dest,
						containerId: actionToDispatch.payload.id,
					},
				})
			}
		})

		return next(action)
	}

	socket.on('action', action => {
		dispatch(action)
	})

	return next => {
		return action => {
			const { type } = action

			if (type.indexOf('device/') > -1) {
				return _handleActionsToDevice(action, next)
			} else if (type.indexOf('device:get/') > -1) {
				return _handleGetActionsToDevice(action, next)
			} else if (type.indexOf('db/') > -1) {
				return _handleActionsToDb(action, next)
			} else if (type.indexOf('devices/') > -1) {
				return _handleActionsToDevices(action, next)
			}

			next(action)
		}
	}
}
