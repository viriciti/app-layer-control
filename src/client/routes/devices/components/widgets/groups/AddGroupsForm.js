import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { without, isEmpty } from 'lodash'

import { storeGroups } from '/routes/devices/modules/actions'
import AsyncButton from '/components/common/AsyncButton'
import selectedDeviceSelector from '/routes/devices/modules/selectors/getSelectedDevice'

class AddGroupsForm extends PureComponent {
	state = {
		selectedGroups: [],
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
							<AsyncButton
								type="submit"
								className="btn btn-light"
								onClick={this.onSubmit}
								busy={this.props.isStoringGroups.includes(this.props.selectedDevice.get('deviceId'))}
								busyText="Sending ..."
							>
								Send
							</AsyncButton>
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
			selectedDevice:  selectedDeviceSelector(state),
			groups:          state.get('groups'),
			isStoringGroups: state.getIn(['userInterface', 'isStoringGroups']),
		}
	},
	{ storeGroups }
)(AddGroupsForm)
