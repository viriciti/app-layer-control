import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import axios from 'axios'
import { toast } from 'react-toastify'

import GroupsForm from './GroupsForm'
import { fetchGroups } from '/routes/administration/modules/actions'
import selectorDevicesDeviceId from '/routes/administration/modules/selectors/getDevicesSerial'

class GroupsTable extends PureComponent {
	state = {
		isAdding:  false,
		isEditing: false,
		editing:   null,
		deleting:  false,
	}

	componentDidMount () {
		this.props.fetchGroups()
	}

	renderGroups () {
		return this.props.groups
			.sortBy((_, label) => label)
			.entrySeq()
			.map(([label, applications]) => {
				return (
					<tr key={label}>
						<td>{label}</td>
						<td>
							<ul className="list-unstyled">
								{applications.size ? (
									applications.entrySeq().map(([application, version]) => {
										if (version) {
											return (
												<li key={`${label}${application}${version}`} title="Locked version">
													{[application, version].join('@')}
												</li>
											)
										} else {
											return (
												<li key={`${label}${application}`} title="Semantic versioning">
													{[application, this.props.configurations.getIn([application, 'version'])].join('@')}
												</li>
											)
										}
									})
								) : (
									<i className="text-secondary">Empty group</i>
								)}
							</ul>
						</td>
						<td className="text-right">
							<button
								className="btn btn--text btn--icon"
								onClick={this.onEditGroup.bind(this, label)}
								title="Edit group"
							>
								<span className="fas fa-pen" data-toggle="tooltip" />
							</button>

							{label !== 'default' ? (
								<button
									disabled={this.state.deleting}
									className="btn btn--text btn--icon"
									onClick={this.onRemoveGroup.bind(this, label)}
								>
									<span className="fas fa-trash" data-toggle="tooltip" title="Delete group" />
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

	onRemoveGroup = async label => {
		if (!confirm(`Deleting group ${label}. Confirm?`)) {
			return
		}

		this.setState({ deleting: true })

		const { status } = await axios.delete(`/api/v1/administration/group/${label}`)
		if (status === 204) {
			toast.success('Group deleted')
		}

		this.setState({ deleting: false })
	}

	onRequestClose = () => {
		this.setState({ isAdding: false, isEditing: false, editing: null })
	}

	render () {
		return (
			<Fragment>
				<div className="card mb-3">
					<div className="card-header">Groups</div>

					<div className="card-controls card-controls--transparent">
						<button
							className="btn btn-light btn-sm  float-right"
							disabled={this.props.isFetchingGroups}
							onClick={this.onAddGroup}
						>
							<span className="fas fa-plus-circle mr-1" /> Add Group
						</button>
					</div>

					<div className="card-body">
						{this.props.isFetchingGroups ? (
							<div className="loader" />
						) : (
							<Fragment>
								{this.props.groups.size ? (
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
								) : (
									<div className="card-message mt-3">Create a group first</div>
								)}
							</Fragment>
						)}
					</div>
				</div>

				<GroupsForm
					hasDefaultGroup={this.props.groups.has('default')}
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
			groups:           state.get('groups'),
			configurations:   state.get('configurations'),
			devices:          selectorDevicesDeviceId(state),
			isFetchingGroups: state.getIn(['ui', 'isFetchingGroups']),
		}
	},
	{ fetchGroups }
)(GroupsTable)
