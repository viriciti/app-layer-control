import React from 'react'

const ToggleEntry = ({ checked, name, label, toggleLabel, onChange, onBlur }) => {
	return (
		<div className="custom-control custom-checkbox">
			<input
				checked={checked}
				className="custom-control-input"
				id={name}
				type="checkbox"
				onChange={onChange}
				onBlur={onBlur}
			/>
			<label className="custom-control-label" htmlFor={name}>
				{toggleLabel || <span className="invisible">{label}</span>}
			</label>
		</div>
	)
}

export default ToggleEntry
