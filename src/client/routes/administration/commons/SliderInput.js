import React from 'react'

const SliderInput = ({ input, label, toggleLabel, helpText, meta: { touched, error, disabled } }) => {
	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={name}>
				{label}
			</label>

			<div className="col-sm-10">
				<div className="custom-control custom-checkbox">
					<input
						{...input}
						checked={input.checked || input.value || false}
						className="custom-control-input"
						id={input.name}
						type="checkbox"
					/>
					<label className="custom-control-label" htmlFor={input.name}>
						{toggleLabel || <span className="invisible">{label}</span>}
					</label>
				</div>

				{helpText ? (
					<span className="form-text text-muted">
						<span className="fas fa-info-circle fa-fw" /> {helpText}
					</span>
				) : null}
			</div>
		</div>
	)
}

export default SliderInput
