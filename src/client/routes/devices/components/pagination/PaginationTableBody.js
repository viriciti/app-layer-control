import { connect } from 'react-redux'

const mapStateToProps = state => {
	return { paginate: state.get('paginate') }
}

const PaginationTableBody = ({ renderData, paginate, component }) => {
	return renderData
		.slice(
			paginate.get('page') * paginate.get('itemsPerPage'),
			(paginate.get('page') + 1) * paginate.get('itemsPerPage')
		)
		.map(component)
}

export default connect(mapStateToProps)(PaginationTableBody)
