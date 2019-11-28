import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import classNames from 'classnames'
import { noop } from 'lodash'

function AsyncButton ({
	busy,
	busyText,
	children,
	disabled,
	onClick,
	persist,
	white,
	...buttonProps
}) {
	return (
		<button
			{...buttonProps}
			className={classNames(buttonProps.className, {
				'btn--disabled': disabled,
			})}
			onClick={disabled || busy ? noop : onClick}
			disabled={disabled || busy}
		>
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
	busyText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	children: PropTypes.node.isRequired,
	disabled: PropTypes.bool,
	onClick:  PropTypes.func,
	persist:  PropTypes.bool,
	white:    PropTypes.bool,
}

export default AsyncButton
