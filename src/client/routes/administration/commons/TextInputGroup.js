import React, { Fragment } from 'react'
import classNames from 'classnames'
import { noop } from 'underscore'
import { connect } from 'react-redux'

import AsyncButton from 'components/common/AsyncButton'

const TextInputGroup = ({ async, helpText, input, type, placeholder, readOnly, submit, meta: { touched, error } }) => {
	return (
		<Fragment>
			<div className="input-group">
				<input
					{...input}
					readOnly={readOnly}
					onChange={readOnly ? noop : input.onChange}
					onBlur={readOnly ? noop : input.onBlur}
					id={input.name}
					type={type}
					placeholder={placeholder}
					className={classNames('form-control', { 'is-invalid': touched && error && !readOnly })}
				/>

				<div className="input-group-append">
					<AsyncButton
						className="btn btn-primary btn--no-underline"
						busy={!!async[submit.reduxKey]}
						busyText={submit.textBusy}
					>
						<span className={submit.icon} /> {submit.text}
					</AsyncButton>
				</div>
			</div>

			{touched && error && !readOnly ? (
				<span className="form-text text-danger">
					<span className="fas fa-exclamation-circle fa-fw" /> {error}
				</span>
			) : helpText ? (
				<span className="form-text text-muted">
					<span className="fas fa-info-circle fa-fw" /> {helpText}
				</span>
			) : null}
		</Fragment>
	)
}

export default connect((state, ownProps) => {
	return {
		async: {
			[ownProps.submit.reduxKey]: state.getIn(['userInterface', ownProps.submit && ownProps.submit.reduxKey]),
		},
	}
})(TextInputGroup)
