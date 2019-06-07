import React from 'react'

export default function Advice ({
	forceHide = false,
	size,
	items,
	message,
	replaceComma = 'and',
}) {
	if (!forceHide && size) {
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
					<small>{items ? items.size : size} pending action(s)</small>
					<span className="fas fa-hand-holding ml-1" />
				</span>
			</div>
		)
	} else {
		return null
	}
}
