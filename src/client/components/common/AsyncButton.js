import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import { noop } from 'underscore'

function AsyncButton ({ busy, busyText, children, onClick, ...buttonProps }) {
	return (
		<button {...buttonProps} onClick={busy ? noop : onClick} disabled={busy}>
			{busy ? (
				<Fragment>
					<div className="loader" /> {busyText}
				</Fragment>
			) : (
				children
			)}
		</button>
	)
}

AsyncButton.propTypes = {
	busy:     PropTypes.bool.isRequired,
	busyText: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
}

export default AsyncButton
