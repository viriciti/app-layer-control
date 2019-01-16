import React from 'react'
import { List } from 'immutable'
import sentenceCase from 'sentence-case'
import moment from 'moment'

const OngoingTask = ({ name, queuedOn }) => {
	return (
		<li>
			<span className="fas fa-angle-double-right text-info p-2" />
			{moment(queuedOn).fromNow()} <b>-</b> {sentenceCase(name)}
		</li>
	)
}

const FinishedTask = ({ name, finishedAt, status, error }) => {
	const time = moment(finishedAt)

	if (status === 'ok') {
		return (
			<li>
				<span className="fas fa-check text-success p-2" />
				<span title={time.format('HH:mm:ss')}>{time.fromNow()}</span> <b>-</b> {sentenceCase(name)}
			</li>
		)
	} else {
		return (
			<li>
				<span
					className="fas fa-exclamation-circle text-danger p-2"
					title={`(${error.get('code', 1)}) Failed to execute '${name}'`}
				/>
				<span title={time.format('HH:mm:ss')}>{time.fromNow()}</span> <b>-</b> {sentenceCase(name)}:{' '}
				{error.get('message')}
			</li>
		)
	}
}

const Queue = ({ selectedDevice }) => {
	const deviceId = selectedDevice.get('deviceId')

	return (
		<div className="row">
			<div className="col-12">
				<h5>
					<span className="fas fa-sort-numeric-down pt-1" /> Queue
				</h5>

				<hr />

				<ul className="list list--striped">
					{selectedDevice
						.get('queue', List())
						.sortBy(task => {
							return -task.get('queuedOn')
						})
						.map((task, index) => {
							if (task.get('finished')) {
								return (
									<FinishedTask
										key={`finishedItem${deviceId}${index}`}
										error={task.get('error')}
										finishedAt={task.get('finishedAt')}
										name={task.get('name')}
										status={task.get('status')}
									/>
								)
							} else {
								return (
									<OngoingTask
										key={`queuedItem${deviceId}${index}`}
										name={task.get('name')}
										queuedOn={task.get('queuedOn')}
									/>
								)
							}
						})}
				</ul>
			</div>
		</div>
	)
}

export default Queue
