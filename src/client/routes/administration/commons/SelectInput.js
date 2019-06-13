import React from 'react'
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { map, isString, get } from 'lodash'

function castToString (source, key) {
	return isString(get(source, key)) ? get(source, key) : source
}

const VersionInput = ({
	input,
	label,
	options,
	meta: { touched, error, disabled },
}) => {
	const renderOptions = () =>
		map(
			options
				.slice()
				.sort((left, right) =>
					naturalCompare(
						castToString(left, 'title'),
						castToString(right, 'title')
					)
				),
			(option, i) => {
				const title = castToString(option, 'title')
				const value = castToString(option, 'value')

				return (
					<option key={`option${i}`} value={value}>
						{title}
					</option>
				)
			}
		)

	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<select
					{...input}
					className={classNames('custom-select', {
						'is-invalid': touched && error && !disabled,
					})}
				>
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
