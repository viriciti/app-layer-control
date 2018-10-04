import React, { Component } from 'react'
import { connect } from 'react-redux'
import { without, isEmpty } from 'underscore'

import { storeGroups } from '../../../modules/actions'
import selectedDeviceSelector from '../../../modules/selectors/getSelectedDevice'

class AddGroupsForm extends Component {
	state = {
		selectedGroups: [],
	}

	shouldComponentUpdate (nextProps, nextState) {
		if (this.state.selectedGroups !== nextState.selectedGroups) {
			return true
		} else {
			return !nextProps.groups.equals(this.props.groups)
		}
	}

	renderOptions = () => {
		const placeholder = (
			<option key="group-select-placeholder" value="">
				Please select a group
			</option>
		)
		if (!this.props.groups) return placeholder

		return [placeholder].concat(
			this.props.groups
				.keySeq()
				.filter(group => {
					return group !== 'default'
				})
				.map(group => {
					return (
						<option key={group} value={group}>
							{' '}
							{group}
						</option>
					)
				})
		)
	}

	onGroupSelected = e => {
		const group = e.target.value
		const selectedGroups = this.state.selectedGroups

		if (selectedGroups.indexOf(group) > -1 || !group) {
		} else {
			this.setState({ selectedGroups: selectedGroups.concat(group) })
		}
	}

	onGroupDeselected = group => {
		this.setState({
			selectedGroups: without(this.state.selectedGroups, group),
		})
	}

	onSubmit = e => {
		e.preventDefault()

		if (isEmpty(this.state.selectedGroups)) {
			return alert('Select some groups to send!')
		}

		if (!confirm('Sending groups. Are you sure?')) {
			return
		}

		this.props.storeGroups({
			dest:    this.props.selectedDevice.get('deviceId'),
			payload: this.state.selectedGroups,
		})

		this.setState({ selectedGroups: [] })
	}

	renderSelectedGroups = () => {
		return this.state.selectedGroups.map(group => {
			return (
				<span className="label d-inline-block m-1" style={{ border: '2px solid', borderRadius: '20px' }} key={group}>
					{group}
					<span
						className="fas fa-minus-circle font-size-sm pl-2"
						data-toggle="tooltip"
						title="Deselect"
						onClick={() => {
							return this.onGroupDeselected(group)
						}}
					/>
				</span>
			)
		})
	}

	render () {
		return (
			<div>
				<div className="row">
					<div className="col-12">
						<form>
							<div className="form-group">
								<label htmlFor="groups">Insert the groups from low to high priority</label>
								<select
									disabled={this.props.groups.length === 0}
									className="form-control"
									name="groups"
									onClick={this.onGroupSelected}
								>
									{this.renderOptions()}
								</select>
							</div>
							<div className="form-group">{this.renderSelectedGroups()}</div>
							<button type="submit" className="btn btn-primary" onClick={this.onSubmit}>
								Send
							</button>
						</form>
					</div>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			selectedDevice: selectedDeviceSelector(state),
			groups:         state.get('groups'),
		}
	},
	{ storeGroups }
)(AddGroupsForm)
