import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'

import GroupsForm from './GroupsForm'
import { removeGroup, sendGroupToAllDevices, removeGroupFromAllDevices } from '../modules/actions'
import selectorDevicesDeviceId from '../modules/selectors/getDevicesSerial'

class GroupsTable extends PureComponent {
	state = {
		isAdding:  false,
		isEditing: false,
		editing:   null,
	}

	renderNoDefaultGroupAlert () {
		if (!this.props.groups.has('default')) {
			return (
				<div className="row">
					<div className="col-12">
						<div className="alert alert-info">
							<span className="fas fa-info-circle mr-2" />
							You must create the default group before you can create other groups.
						</div>
					</div>
				</div>
			)
		}
	}

	renderGroups () {
		return this.props.groups.entrySeq().map(([label, applications]) => {
			return (
				<tr key={label}>
					<td>{label}</td>
					<td>{applications.join(', ')}</td>
					<td className="text-right">
						<button className="btn btn--text btn--icon" onClick={this.onEditGroup.bind(this, label)} title="Edit group">
							<span className="fas fa-pen" data-toggle="tooltip" />
						</button>

						{label !== 'default' ? (
							<button className="btn btn--text btn--icon" onClick={this.onRemoveGroup.bind(this, label)}>
								<span className="fas fa-trash" data-toggle="tooltip" title="Remove group" />
							</button>
						) : null}
					</td>
				</tr>
			)
		})
	}

	onAddGroup = () => {
		this.setState({ isAdding: true })
	}

	onEditGroup = label => {
		this.setState({
			isEditing: true,
			editing:   Map({
				label,
				applications: this.props.groups.get(label),
			}),
		})
	}

	onRemoveGroup = label => {
		if (!confirm(`Deleting group ${label}. Confirm?`)) {
			return
		}

		this.props.removeGroup(label)
		this.props.removeGroupFromAllDevices({ payload: label, dest: this.props.devices })
	}

	onRequestClose = () => {
		this.setState({ isAdding: false, isEditing: false, editing: null })
	}

	render () {
		return (
			<Fragment>
				<div className="card mb-3">
					<div className="card-header">Groups</div>
					<div className="card-body">
						{this.renderNoDefaultGroupAlert()}

						<div className="float-right mt-1 mb-3">
							<button className="btn btn-primary" onClick={this.onAddGroup}>
								<span className="fas fa-layer-group" /> Add Group
							</button>
						</div>

						<table className="table">
							<thead className="thead-light">
								<tr>
									<th>Label</th>
									<th>Applications</th>
									<th />
								</tr>
							</thead>
							<tbody>{this.renderGroups()}</tbody>
						</table>
					</div>
				</div>

				<GroupsForm
					isAdding={this.state.isAdding}
					isEditing={this.state.isEditing}
					editing={this.state.editing}
					onRequestClose={this.onRequestClose}
				/>
			</Fragment>
		)
	}
}

export default connect(
	state => {
		return {
			groups:  state.get('groups'),
			devices: selectorDevicesDeviceId(state),
		}
	},
	{ removeGroup, sendGroupToAllDevices, removeGroupFromAllDevices }
)(GroupsTable)
