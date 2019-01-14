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

const FinishedTask = ({ name, finishedAt }) => {
	const time = moment(finishedAt)

	return (
		<li>
			<span className="fas fa-check text-success p-2" />
			<span title={time.format('HH:mm:ss')}>{time.fromNow()}</span> <b>-</b> {sentenceCase(name)}
		</li>
	)
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
							console.log(task.toJS())
							return -task.get('queuedOn')
						})
						.map((task, index) => {
							if (task.get('finished')) {
								return (
									<FinishedTask
										key={`finishedItem${deviceId}${index}`}
										name={task.get('name')}
										finishedAt={task.get('finishedAt')}
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
