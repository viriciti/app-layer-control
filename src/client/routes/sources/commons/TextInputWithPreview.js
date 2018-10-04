import React from 'react'
import classNames from 'classnames'

const Preview = ({ deviceSources, editing, value }) => {
	return (
		<div className="sources-preview mt-4 mb-3 mx-0 row">
			{deviceSources
				.filter(source => {
					return source.get('headerName').toLowerCase() !== editing.get('headerName').toLowerCase()
				})
				.sort((left, right) => {
					return left.get('columnIndex') - right.get('columnIndex')
				})
				.valueSeq()
				.map(field => {
					return (
						<span
							key={field.get('headerName')}
							className={`${
								editing.get('headerName') === field.get('headerName') ? 'font-weight-bold' : ''
							} sources-preview--item col`}
						>
							{field.get('headerName')}{' '}
							<small className="d-block">
								({editing.get('headerName') === field.get('headerName') ? value : field.get('columnIndex')})
							</small>
						</span>
					)
				})}
		</div>
	)
}

const TextInputWithPreview = ({
	helpText,
	input,
	label,
	meta: { touched, error, disabled },
	placeholder,
	previewAvailable,
	deviceSource,
	deviceSources,
	type,
}) => {
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
				) : helpText ? (
					<span className="form-text text-muted">
						<span className="fas fa-info-circle fa-fw" /> {helpText}
					</span>
				) : null}

				{previewAvailable ? (
					<Preview deviceSources={deviceSources} editing={deviceSource} value={input.value} />
				) : (
					<span className="form-text text-muted">
						<span className="fas fa-eye-slash fa-fw" /> Preview is not available when adding new columns
					</span>
				)}
			</div>
		</div>
	)
}

export default TextInputWithPreview
