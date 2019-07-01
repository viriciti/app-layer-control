import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { partial } from 'lodash'
import { List } from 'immutable'

import AddGroupsForm from './AddGroupsForm'
import { asyncRemoveGroup } from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'
import { isLastElement } from '/utils/position'

function DeviceGroups ({
	groups,
	configurations,
	selectedDevice,
	asyncRemoveGroup,
}) {
	const inGroups      = selectedDevice.get('groups')
	const btnClass      = 'btn-light btn--icon btn--text'
	const onRemoveGroup = group => {
		if (confirm(`Removing group ${group}. Are you sure?`)) {
			asyncRemoveGroup(selectedDevice.get('deviceId'), group)
		}
	}

	return (
		<div>
			<h5>
				<span className="fas fa-cubes pr-1" /> Groups
			</h5>

			<hr />

			<div className="row">
				<div className="col-12">
					{!selectedDevice.get('groups', List()).isEmpty() ? (
						<table className="table table--wrap">
							<thead className="thead-light">
								<tr>
									<th style={{ minWidth: 25 }} />
									<th>Label</th>
									<th>Applications</th>
									<th style={{ minWidth: 25 }} />
								</tr>
							</thead>
							<tbody>
								{inGroups.map((group, index) => (
									<tr key={group}>
										<td>
											{inGroups.size > 2 ? (
												index === 0 ? null : isLastElement(inGroups, index) ? (
													<button className={btnClass}>
														<span className="fas fa-sort-up" title="Move up" />
													</button>
												) : (
													<Fragment>
														{index > 1 ? (
															<button className={btnClass}>
																<span
																	className="fas fa-sort-up"
																	title="Move up"
																/>
															</button>
														) : null}

														<button className={btnClass}>
															<span
																className="fas fa-sort-down"
																title="Move down"
															/>
														</button>
													</Fragment>
												)
											) : null}
										</td>
										<td>{group}</td>
										<td>
											<ul className="list-unstyled">
												{groups.has(group) ? (
													groups
														.get(group)
														.entrySeq()
														.map(([name, version]) =>
															version ? (
																<li
																	key={toReactKey(group, name, version)}
																	title="Locked version"
																>
																	{[name, version].join('@')}
																</li>
															) : (
																<li
																	key={toReactKey(group, name)}
																	title="Semantic versioning"
																>
																	{[
																		name,
																		configurations.getIn([name, 'version']),
																	].join('@')}
																</li>
															)
														)
												) : (
													<i>Not available</i>
												)}
											</ul>
										</td>
										<td className="text-right">
											{group === 'default' ? (
												''
											) : (
												<button
													className="btn btn--text btn--icon float-right"
													onClick={partial(onRemoveGroup, group)}
													data-toggle="tooltip"
													title="Delete group"
												>
													<span className="fas fa-times-circle text-danger" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<span className="d-inline-block text-secondary my-3">
							No groups on the device
						</span>
					)}
				</div>
			</div>
			<div className="row">
				<div className="col-12">
					<AddGroupsForm groups={groups} />
				</div>
			</div>
		</div>
	)
}

export default connect(
	state => {
		return {
			groups:         state.get('groups'),
			configurations: state.get('configurations'),
		}
	},
	{ asyncRemoveGroup }
)(DeviceGroups)
