import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Map, List } from 'immutable'
import semver from 'semver'

import GroupsForm from './GroupsForm'
import {
	fetchGroups,
	asyncRemoveGroup,
} from '/routes/administration/modules/actions'
import toReactKey from '/utils/toReactKey'
import getAsyncState from '/store/selectors/getAsyncState'

const Version = ({ name, range, effectiveVersion }) => {
	if (effectiveVersion) {
		return (
			<li>
				{name}@{range}
				<small
					className="label label-sm label--inline float-right"
					title="Effective version for this application"
				>
					{effectiveVersion}
				</small>
			</li>
		)
	} else {
		return (
			<li>
				{name}@{range}
				<span className="float-right text-warning">
					<span
						className="fas fa-exclamation-triangle"
						title="Effective version could not be calculated"
					/>
				</span>
			</li>
		)
	}
}

const LockedVersion = ({ name, version }) => (
	<li>
		{name}@{version}
	</li>
)

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

	getRepositoryVersions (repository) {
		return this.props.registryImages
			.find((_, name) => repository === name, null, Map())
			.get('versions', List())
			.filter(semver.valid)
	}

	getRange (name) {
		return this.props.configurations.getIn([name, 'version'])
	}

	getEffectiveVersion (name) {
		const versions = this.getRepositoryVersions(
			this.props.configurations.getIn([name, 'fromImage'])
		)
		const range    = this.getRange(name)

		return semver.maxSatisfying(versions.toArray(), range)
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

		this.props.asyncRemoveGroup(label)
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
										<tbody>
											{this.props.groups
												.sortBy((_, label) => label)
												.entrySeq()
												.map(([label, applications]) => (
													<tr key={label}>
														<td>{label}</td>
														<td>
															<ul className="list-unstyled">
																{applications.size ? (
																	applications
																		.entrySeq()
																		.map(([application, version]) =>
																			version ? (
																				<LockedVersion
																					key={toReactKey(
																						label,
																						application,
																						version
																					)}
																					name={application}
																					version={version}
																				/>
																			) : (
																				<Version
																					key={toReactKey(label, application)}
																					name={application}
																					range={this.getRange(application)}
																					effectiveVersion={this.getEffectiveVersion(
																						application
																					)}
																				/>
																			)
																		)
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
																<span
																	className="fas fa-pen"
																	data-toggle="tooltip"
																/>
															</button>

															{label !== 'default' ? (
																<button
																	disabled={this.state.deleting}
																	className="btn btn--text btn--icon"
																	onClick={this.onRemoveGroup.bind(this, label)}
																>
																	<span
																		className="fas fa-trash"
																		data-toggle="tooltip"
																		title="Delete group"
																	/>
																</button>
															) : null}
														</td>
													</tr>
												))}
										</tbody>
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
			configurations:   state.get('configurations', Map()),
			registryImages:   state.get('registryImages'),
			isFetchingGroups: getAsyncState('isFetchingGroups')(state),
		}
	},
	{ fetchGroups, asyncRemoveGroup }
)(GroupsTable)
