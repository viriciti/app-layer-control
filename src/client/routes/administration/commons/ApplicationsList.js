import React from 'react'
import classNames from 'classnames'
import { without } from 'underscore'
import naturalCompare from 'natural-compare-lite'

const Application = ({ label }) => {
	return (
		<li>
			<span
				className="my-1 label label--disabled label--icon-absolute label--no-hover"
				title="The image for this application has not been synchronized yet"
			>
				{label}
				<span className="fas fa-ban text-danger fa-fw" />
			</span>
		</li>
	)
}

const AvailableApplication = ({ label, onToggle, isSelected }) => {
	return (
		<li>
			<span onClick={onToggle} className={classNames('my-1', 'label', { 'label--success': isSelected })}>
				{label}
			</span>
		</li>
	)
}

export default ({ helpText, label, labels, registryImagesNames, input, meta: { touched, error, disabled } }) => {
	const onToggle = name => {
		const newApplications = input.value.includes(name) ? without(input.value, name) : input.value.concat([name])

		if (input.value.includes(name)) {
			input.onChange(newApplications)
		} else {
			input.onChange(newApplications)
		}

		input.onBlur(newApplications)
	}

	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<ul className="list-unstyled">
					{labels
						.sort((previous, next) => {
							return naturalCompare(previous.label, next.label)
						})
						.map(({ label, value, image }) => {
							if (registryImagesNames.includes(image)) {
								return (
									<AvailableApplication
										key={value}
										label={label}
										onToggle={onToggle.bind(null, value)}
										isSelected={input.value.includes(value)}
									/>
								)
							} else {
								return <Application key={value} label={label} />
							}
						})}
				</ul>

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
