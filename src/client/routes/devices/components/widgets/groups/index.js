import React, { Fragment, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { partial } from 'lodash'
import { List } from 'immutable'
import semver from 'semver'

import GroupsForm from './GroupsForm'
import { asyncRemoveGroup } from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'
import { isLastElement, moveElement } from '/utils/position'

function DeviceGroups ({ groups, configurations, selectedDevice, asyncRemoveGroup }) {
	// console.log(configurations, semver.maxSatisfying())

	const btnClass              = 'btn-light btn--icon btn--text d-block'
	const inGroups              = selectedDevice.get('groups')
	const [draft, updateDraft]  = useState(inGroups)
	const [touched, setTouched] = useState(false)

	const onTouch    = () => setTouched(true)
	const onMoveDown = index => updateDraft(moveElement(draft, index, index + 1))
	const onMoveUp   = index => updateDraft(moveElement(draft, index, index - 1))

	const onRemoveGroup = group => {
		if (confirm(`Removing group ${group}. Are you sure?`)) {
			asyncRemoveGroup(selectedDevice.get('deviceId'), group)
		}
	}

	useEffect(() => {
		if (draft !== inGroups) {
			updateDraft(inGroups)
		}
	}, [inGroups])

	return (
		<Fragment>
			<h5>
				<span className="fad fa-users-class pr-1" /> Groups
			</h5>

			<hr />

			<div className="row">
				<div className="col-12">
					{!selectedDevice.get('groups', List()).isEmpty() ? (
						<table className="table table--wrap">
							<thead className="thead-light">
								<tr>
									<th style={{ minWidth: 15 }} />
									<th>Label</th>
									<th>Applications</th>
									<th style={{ minWidth: 25 }} />
								</tr>
							</thead>
							<tbody>
								{draft.map((group, index) => (
									<tr key={group.get('label')}>
										<td>
											{inGroups.size > 2 ? (
												index === 0 ? null : isLastElement(inGroups, index) ? (
													<button className={btnClass} onClick={partial(onMoveUp, index)}>
														<span className="fas fa-arrow-up" title="Move up" />
													</button>
												) : (
													<Fragment>
														{index > 1 ? (
															<button className={btnClass} onClick={partial(onMoveUp, index)}>
																<span className="fas fa-arrow-up" title="Move up" />
															</button>
														) : null}

														<button className={btnClass} onClick={partial(onMoveDown, index)}>
															<span className="fas fa-arrow-down" title="Move down" />
														</button>
													</Fragment>
												)
											) : null}
										</td>
										<td>{group.get('label')}</td>
										<td>
											<ul className="list-unstyled">
												{group
													.get('applications')
													.entrySeq()
													.map(([application, version]) => (
														<li key={toReactKey(group, name, application)}>
															{version ? [application, version].join('@') : application}
														</li>
													))}
											</ul>
										</td>
										<td className="text-right">
											{group.get('label') === 'default' ? null : (
												<button
													className="btn btn--text btn--icon float-right"
													onClick={partial(onRemoveGroup, group.get('label'))}
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
						<span className="d-inline-block text-secondary my-3">No groups on the device</span>
					)}
				</div>
			</div>
			<div className="row">
				<div className="col-12">
					<GroupsForm onTouch={onTouch} inGroups={draft} touched={touched || draft !== inGroups} />
				</div>
			</div>
		</Fragment>
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
