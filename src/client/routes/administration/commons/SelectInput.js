import React from 'react'
import classNames from 'classnames'
import { map, isString } from 'underscore'

const VersionInput = ({ input, label, options, meta: { touched, error, disabled } }) => {
	const renderOptions = () => {
		return map(options, (option, i) => {
			const title = isString(option.title) ? option.title : option
			const value = isString(option.value) ? option.value : option

			return (
				<option key={`option-${i}`} value={value}>
					{title}
				</option>
			)
		})
	}

	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<select {...input} className={classNames('custom-select', { 'is-invalid': touched && error && !disabled })}>
					<option />
					{renderOptions()}
				</select>

				{touched && error && !disabled ? (
					<span className="form-text text-danger">
						<span className="fas fa-exclamation-circle fa-fw" /> {error}
					</span>
				) : null}
			</div>
		</div>
	)
}

export default VersionInput
