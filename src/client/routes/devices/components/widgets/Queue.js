import React from 'react'
import { List } from 'immutable'

const Queue = ({ selectedDevice }) => {
	return (
		<div className="row">
			<div className="col-12">
				<h5>
					<span className="fas fa-sort-numeric-down pt-1" /> Queue
				</h5>

				<hr />

				<ul>
					{selectedDevice
						.get('device', List())
						.valueSeq()
						.map((item, i) => {
							return <li key={`queue-item-${i}`}>{`${i + 1}: ${item}`}</li>
						})}
				</ul>
			</div>
		</div>
	)
}

export default Queue
