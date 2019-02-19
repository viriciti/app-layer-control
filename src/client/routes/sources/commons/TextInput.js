import React from 'react'
import classNames from 'classnames'

const TextInput = ({ helpText, input, label, type, placeholder, readOnly, meta: { touched, error, disabled } }) => {
	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<input
					{...input}
					className={classNames('form-control', { 'is-invalid': touched && error && !disabled })}
					id={input.name}
					placeholder={placeholder}
					type={type}
					readOnly={readOnly}
				/>

				{touched && error && !disabled ? (
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
