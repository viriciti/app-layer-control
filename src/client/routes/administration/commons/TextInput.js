import React from 'react'
import classNames from 'classnames'
import { noop } from 'underscore'

const TextInput = ({ helpText, input, label, type, placeholder, readOnly, meta: { touched, error } }) => {
	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
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

				{touched && error && !readOnly ? (
					<span className="form-text text-danger">
						<span className="fas fa-exclamation-circle fa-fw" /> {error}
					</span>
				) : helpText ? (
					<span className="form-text text-muted">
						<span className="fas fa-info-circle fa-fw" /> {helpText}
					</span>
				) : null}
			</div>
		</div>
	)
}

export default TextInput
