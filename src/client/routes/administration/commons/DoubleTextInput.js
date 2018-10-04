import React from 'react'
import { fromJS } from 'immutable'
import { Field } from 'redux-form/immutable'

const renderField = ({ input, placeholder, meta: { error, touched } }) => {
	return (
		<div>
			<div>
				<input {...input} placeholder={placeholder} className="form-control room-xs-vertical" />
				{touched && error && <span>{error}</span>}
			</div>
		</div>
	)
}

export default ({ fields, fieldsNames, label, submitLabel = 'Add configuration' }) => {
	return (
		<ul>
			<li>
				<div>
					<label className="col-form-label">{label}</label>
					<div style={{ marginBottom: '10px' }}>
						<button
							className="btn btn-primary btn-block"
							type="button"
							onClick={() => {
								return fields.push(fromJS({}))
							}}
						>
							{submitLabel}
						</button>
					</div>
				</div>
			</li>
			{fields.map((input, inputIndex) => {
				return (
					<li key={inputIndex}>
						<div className="mb-3">
							<div>
								<Field
									name={`${input}.${fieldsNames.first}`}
									type="text"
									label={fieldsNames.first}
									placeholder={fieldsNames.first}
									component={renderField}
								/>
							</div>
							<div>
								<Field
									name={`${input}.${fieldsNames.second}`}
									type="text"
									label={fieldsNames.second}
									placeholder={fieldsNames.second}
									component={renderField}
								/>
							</div>
							<div>
								<button
									className="btn btn-secondary mt-1 mb-2"
									type="button"
									onClick={() => {
										return fields.remove(inputIndex)
									}}
								>
									<span className="fas fa-trash" /> Remove
								</button>
							</div>
						</div>
					</li>
				)
			})}
		</ul>
	)
}
