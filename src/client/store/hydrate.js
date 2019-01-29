export default ws => {
	const endpoints = [
		{ action: 'DEVICES_STATE', url: '/api/devices' },
		{ action: 'CONFIGURATIONS', url: '/api/v1/administration/applications' },
		{ action: 'DEVICE_SOURCES', url: '/api/v1/administration/sources' },
		{ action: 'GROUPS', url: '/api/v1/administration/groups' },
		{ action: 'REGISTRY_IMAGES', url: '/api/v1/administration/registry' },
	]

	return async dispatch => {
		const responses = await Promise.all(
			endpoints.map(endpoint =>
				fetch(endpoint.url)
					.then(response => response.json())
					.then(({ data }) => ({
						action: endpoint.action,
						data,
					}))
			)
		)

		responses.forEach(({ action, data }) =>
			dispatch({
				type: action,
				data: data,
			})
		)

		ws.addEventListener('message', ({ data: message }) => {
			try {
				const json = JSON.parse(message)
				const { action, data } = json

				if (!action) {
					throw new Error('No action found in WebSocket message:')
				}

				dispatch({ type: action, data: data })
			} catch (error) {
				console.error(error.message)
			}
		})
	}
}
