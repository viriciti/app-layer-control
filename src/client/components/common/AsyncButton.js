import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import classNames from 'classnames'
import { noop } from 'lodash'

function AsyncButton ({ busy, busyText, children, onClick, white, persist, ...buttonProps }) {
	return (
		<button {...buttonProps} onClick={busy ? noop : onClick} disabled={busy}>
			{busy ? (
				<Fragment>
					{persist ? null : <div className={classNames('loader', { 'loader--white': white })} />}
					{busyText || children}
				</Fragment>
			) : (
				children
			)}
		</button>
	)
}

AsyncButton.propTypes = {
	busy:     PropTypes.bool.isRequired,
	busyText: PropTypes.string,
	children: PropTypes.node.isRequired,
	onClick:  PropTypes.func,
	white:    PropTypes.bool,
}

export default AsyncButton
