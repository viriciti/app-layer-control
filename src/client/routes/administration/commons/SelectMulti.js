import React from 'react'
import MultiSelect from "react-multi-select-component";
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { map } from 'lodash'


const SelectMulti = ({
	input,
	label,
	options,
	meta: { touched, error, disabled },
}) => {
	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<MultiSelect
					className="multi-select multi-select__no-float"
					options={options}
					value={input.value}
					onChange={input.onChange}
				/>

				{touched && error && !disabled ? (
					<span className="form-text text-danger">
						<span className="fas fa-exclamation-circle fa-fw" /> {error}
					</span>
				) : null}
			</div>
		</div>
	)
}

export default SelectMulti
