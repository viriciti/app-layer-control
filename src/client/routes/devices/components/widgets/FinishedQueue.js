import React, { PureComponent } from 'react'
import _ from 'underscore'
import moment from 'moment'

const FORMAT = 'YYYY-MM-DD HH:mm:ss'

class FinishedQueue extends PureComponent {
	renderExitState = s => {
		if (s === 'success') return <span className="font-weight-bold text--success">&#10003;</span>
		if (s === 'error') return <span className="font-weight-bold text--error">&#10007;</span>
		return <span className="font-weight-bold text--warning">&#10061;</span>
	}

	render () {
		let queue = this.props.selectedDevice.get('finishedQueueList')
		queue = queue ? queue.toJS() : []
		return (
			<div className="row">
				<div className="col-12">
					<h5>
						<span className="fas fa-check pt-1" /> Finished
					</h5>

					<hr />

					<ul className="list list--primary">
						{_(queue).map((item, i) => {
							const { timestamp, name, message, exitState } = item
							return (
								<li key={`queue-item-${i}`}>
									{this.renderExitState(exitState)}
									<span />
									<span style={{ width: '50px' }}>{moment(timestamp).format(FORMAT)}</span>
									<span> - </span>
									<span style={{ width: '50px' }}>{name}</span>
									<span>: </span>
									<span>{message}</span>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		)
	}
}

export default FinishedQueue
