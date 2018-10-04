import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import AddGroupsForm from './AddGroupsForm'
import { removeGroup } from '../../../modules/actions'

class DeviceGroups extends PureComponent {
	onRemoveGroup = group => {
		if (!confirm(`Removing group ${group}. Are you sure?`)) return

		this.props.removeGroup({
			dest:    this.props.selectedDevice.get('deviceId'),
			payload: group,
		})
	}

	renderGroups = () => {
		const { groups, selectedDevice } = this.props
		const deviceGroups = selectedDevice.get('groups')

		return deviceGroups.map(group => {
			return (
				<tr key={group}>
					<td>{group}</td>
					<td>{groups.has(group) ? groups.get(group).join(', ') : <i>Not available</i>}</td>
					<td className="text-right">
						{group === 'default' ? (
							''
						) : (
							<span
								className="fas fa-times-circle text-danger group-icon"
								onClick={() => {
									return this.onRemoveGroup(group)
								}}
								data-toggle="tooltip"
								title="Remove group"
							/>
						)}
					</td>
				</tr>
			)
		})
	}

	render () {
		return (
			<div>
				<h5>
					<span className="fas fa-cubes pr-1" /> Groups
				</h5>

				<hr />

				<div className="row">
					<div className="col-12">
						{this.props.selectedDevice.get('groups') && !this.props.selectedDevice.get('groups').isEmpty() ? (
							<table className="table table--wrap">
								<thead className="thead-light">
									<tr>
										<th>Label</th>
										<th>Applications</th>
										<th style={{ minWidth: 25 }} />
									</tr>
								</thead>
								<tbody>{this.renderGroups()}</tbody>
							</table>
						) : (
							<span className="d-inline-block text-secondary my-3">No groups on the device</span>
						)}
					</div>
				</div>
				<div className="row">
					<div className="col-12">
						<AddGroupsForm groups={this.props.groups} />
					</div>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			groups: state.get('groups'),
		}
	},
	{ removeGroup }
)(DeviceGroups)
