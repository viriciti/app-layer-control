import React, { useState, useEffect } from 'react'
import AsyncButton from '/components/common/AsyncButton'

function PersistentAsyncButton ({ ...props }) {
	const [persist, persistState] = useState(false)

	useEffect(() => {
		if (props.busy) {
			persistState(true)
		}
	}, [props.busy])

	return (
		<AsyncButton {...props} busy={persist || props.busy} persist={persist}>
			{props.children}
		</AsyncButton>
	)
}

export default PersistentAsyncButton
