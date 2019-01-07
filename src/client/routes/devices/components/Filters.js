import _ from 'underscore'
import { List, Map } from 'immutable'
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import { setFilter, clearFilters, applyFilters } from '/routes/devices/modules/actions'
import isFilterEmpty from '/routes/devices/modules/selectors/getEmptyFilters'

class Filters extends PureComponent {
	debouncedApplyFilters = _.debounce(this.props.applyFilters, 200)

	renderInput = (headerName, key) => {
		return (
			<div className="col-4" key={key}>
				<div className="row">
					<label className="col-12 col-form-label" htmlFor={`${key}-input`}>
						{headerName}
					</label>

					<div className="col-12">
						<input
							id={`${key}-input`}
							name={key}
							className="form-control form-control--wide"
							type="text"
							onChange={this.onInputChange}
							value={this.props.columns.getIn([key, 'value'], '')}
							placeholder="Must contain ..."
						/>
					</div>
				</div>
			</div>
		)
	}

	renderCheckboxes = (headerName, key) => {
		const options = this.props.columns.getIn([key, 'filterFormat', 'options'], List())
		const list = this.props.columns.getIn([key, 'value'], List())

		return (
			<div className="col-4" key={key}>
				<div className="row">
					<label className="col-12 col-form-label">{headerName}</label>

					<div className="col-12">
						{options.map(option => {
							return (
								<div key={`${key}-${option.get('value')}`} className="custom-control custom-checkbox">
									<input
										name={key}
										onChange={this.onCheckboxChange}
										type="checkbox"
										className="custom-control-input"
										id={`filter-${option.get('value')}`}
										value={option.get('value')}
										checked={list.includes(option.get('value'))}
									/>
									<label className="custom-control-label" htmlFor={`filter-${option.get('value')}`}>
										{option.get('label')}
									</label>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	onCheckboxChange = event => {
		const key = event.target.name
		const value = event.target.value
		let list = this.props.columns.getIn([key, 'value'], List())

		if (_.isEmpty(list)) {
			list = List()
		}

		if (list.includes(value)) {
			list = list.filterNot(d => {
				return d === value
			})
		} else {
			list = list.push(value)
		}

		const payload = {
			key:   key,
			value: list,
		}
		this.props.setFilter(payload)
		this.debouncedApplyFilters()
	}

	onInputChange = event => {
		const payload = {
			key:   event.target.name,
			value: event.target.value,
		}
		this.props.setFilter(payload)
		this.debouncedApplyFilters()
	}

	onClearFilters = () => {
		this.props.clearFilters()
		this.debouncedApplyFilters()
	}

	render () {
		const { columns } = this.props

		return (
			<div className="card">
				<div className="card-header">Filters</div>
				<div className="card-body spacing-md">
					<form className="form-horizontal">
						<div className="row">
							<div className="col-md-9">
								<div className="row">
									{columns
										.sortBy(column => {
											return column.getIn(['filterFormat', 'type'], 'input')
										})
										.map((column, key) => {
											const headerName = column.get('headerName')
											const type = column.getIn(['filterFormat', 'type'], 'input')

											if (type === 'input') {
												return this.renderInput(headerName, key)
											} else if (type === 'checkboxes') {
												return this.renderCheckboxes(headerName, key)
											}
										})
										.valueSeq()
										.toArray()}
								</div>
							</div>

							<div className="col-md-3">
								<div className="row">
									<div className="col-md-12">
										<button
											type="button"
											className="btn btn-sm btn-secondary mt-1 float-right"
											onClick={this.onClearFilters}
											disabled={this.props.isFilterEmpty}
										>
											<span className="fas fa-undo" /> Reset filter
										</button>
									</div>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			columns:       state.getIn(['filters', 'columns'], Map()),
			isFilterEmpty: isFilterEmpty(state),
		}
	},
	{ setFilter, clearFilters, applyFilters }
)(Filters)
