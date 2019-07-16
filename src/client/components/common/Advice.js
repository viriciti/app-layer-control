import React from 'react'

export default function Advice ({
	forceHide = false,
	size,
	items,
	message,
	replaceComma = 'and',
}) {
	if (forceHide || !size) {
		return null
	} else {
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
					<small>{items ? items.size : size} manual action(s)</small>
				</span>
			</div>
		)
	}
}
