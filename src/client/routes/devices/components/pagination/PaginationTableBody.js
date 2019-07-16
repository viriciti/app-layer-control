import { Component } from 'react'
import { connect } from 'react-redux'
import { paginateTo } from '/routes/devices/actions/index'

function getRangeStart (source) {
	return source.get('page') * source.get('itemsPerPage')
}

class PaginationTableBody extends Component {
	state = {}

	static getDerivedStateFromProps (props, state) {
		const startFrom = getRangeStart(props.paginate)

		if (startFrom > props.renderData.size) {
			return { ...state, isInRange: false }
		} else {
			return { ...state, isInRange: true }
		}
	}

	shouldComponentUpdate (_, nextState) {
		if (this.state.isInRange && !nextState.isInRange) {
			this.props.paginateTo(0)
		}

		return nextState.isInRange
	}

	render () {
		const paginate  = this.props.paginate
		const startFrom = getRangeStart(paginate)
		const endAt     = (paginate.get('page') + 1) * paginate.get('itemsPerPage')

		return this.props.renderData
			.slice(startFrom, endAt)
			.map(this.props.component)
	}
}

export default connect(
	state => ({
		paginate: state.get('paginate'),
	}),
	{ paginateTo }
)(PaginationTableBody)
