import React from 'react'
import { partial } from 'lodash'

function renderLeft (side, status) {
	if (side === 'left') {
		return <span className="fas fa-angle-left mr-1" />
	}
}

function renderRight (side, status) {
	if (side === 'right') {
		return <span className="fas fa-angle-right ml-1" />
	}
}

export default function Navigation ({ deviceId, status, side, onSelect }) {
	return (
		<button
			className="btn btn-light btn-sm btn--reset-icon"
			onClick={partial(onSelect, deviceId)}
		>
			{renderLeft(side, status)}
			{deviceId}
			{renderRight(side, status)}
		</button>
	)
}
