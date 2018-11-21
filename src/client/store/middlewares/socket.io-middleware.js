import io from 'socket.io-client'
import camelCase from 'camel-case'
import decamelize from 'decamelize'
import { toast } from 'react-toastify'

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
			const { action } = actionToDispatch

			if (error) {
				return notify(
					'error',
					`Error executing action ${decamelize(action, ' ').toUpperCase()} on ${dest.length} devices:`,
					error.data
				)
			}

			notify('success', `Action ${decamelize(action, ' ').toUpperCase()} executed correctly on ${dest.length} devices.`)
		})

		return next(action)
	}

	const _handleActionsToDb = (action, next) => {
		const actionToDispatch = {
			action:  camelCase(action.type.split('/')[1]),
			payload: action.payload,
			meta:    action.meta,
		}

		socket.emit('action:db', actionToDispatch, error => {
			const { action } = actionToDispatch

			console.log(error)
			if (error) {
				return notify('error', `Error executing action ${decamelize(action, ' ').toUpperCase()}:`, error.message)
			}

			notify('success', `Action ${decamelize(action, ' ').toUpperCase()} executed correctly.`)
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
			const { dest, action } = actionToDispatch

			if (error) {
				return notify(
					'error',
					`Error action ${decamelize(action, ' ').toUpperCase()} to device ${dest.toUpperCase()}:`,
					error.data
				)
			}

			if (!result) return

			if (result.timeout) {
				return notify(
					'warning',
					`${dest.toUpperCase()} ${decamelize(action, '_').toUpperCase()}: ${JSON.stringify(result.timeout)}`
				)
			}
			if (result.data) {
				return notify(
					'success',
					`${dest.toUpperCase()} ${decamelize(action, '_').toUpperCase()}: ${JSON.stringify(result.data)}`
				)
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
				return notify(
					'error',
					`Error action ${decamelize(actionToDispatch.action, ' ').toUpperCase()} to device ${dest.toUpperCase()}:`,
					error.data
				)
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
