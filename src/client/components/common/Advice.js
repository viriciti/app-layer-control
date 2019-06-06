import React from 'react'

export default function Advice ({ size, items, message, replaceComma = 'and' }) {
	if (size) {
		return (
			<div className="float-right card-header__advice">
				<span
					className="badge badge-light"
					title={message.replace(
						'{}',
						items
							? items
								.toArray()
								.join(', ')
								.replace(/,(?!.*,)/i, ` ${replaceComma}`)
							: size
					)}
				>
					<span className="fas fa-hand-holding fa-fw" />
				</span>
			</div>
		)
	} else {
		return null
	}
}
