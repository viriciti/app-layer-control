import React from 'react'
import semver from 'semver'
import classNames from 'classnames'

const VersionInput = ({ input, label, type, placeholder, meta: { touched, error, disabled } }) => {
	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<input
					{...input}
					id={input.name}
					type={type}
					placeholder={placeholder}
					className={classNames('form-control', { 'is-invalid': touched && error && !disabled })}
				/>

				{touched && error && !disabled ? (
					<span className="form-text text-danger">
						<span className="fas fa-exclamation-circle fa-fw" /> {error}
					</span>
				) : input.value ? (
					<span className="form-text text-info">
						<span className="fas fa-code-branch fa-fw" />
						This semantic version matches: <b>{semver.validRange(input.value)}</b>
					</span>
				) : null}
			</div>
		</div>
	)
}

export default VersionInput
