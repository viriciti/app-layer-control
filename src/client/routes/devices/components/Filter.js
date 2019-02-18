import React, { useState } from 'react'
import { connect } from 'react-redux'

import { applyFilter } from '/store/globalReducers/ui'

function Filter ({ applyFilter }) {
	const [query, setQuery] = useState('')
	const onChange          = event => {
		setQuery(event.target.value)
		applyFilter(event.target.value)
	}

	return (
		<div className="card-controls p-0 mb-3">
			<div className="filter-input-group">
				<span className="fas fa-search" />
				<input className="form-control" placeholder="Search for devices ..." onChange={onChange} value={query} />
			</div>
		</div>
	)
}

export default connect(
	null,
	{
		applyFilter,
	}
)(Filter)
