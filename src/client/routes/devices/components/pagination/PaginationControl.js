import React from 'react'
import { connect } from 'react-redux'
import ReactPaginate from 'react-paginate'

import { calculatePages } from './'
import { paginateTo, setItemsPerPage } from '../../modules/actions'

const itemsPerPageOptions = [10, 20, 50]

const mapStateToProps = state => {
	return {
		paginate: state.get('paginate'),
	}
}
const mapDispatchToProps = { paginateTo, setItemsPerPage }

const PaginationControl = ({ data, paginateTo, paginate, pageRange, setItemsPerPage }) => {
	const pages = calculatePages({ data, itemsPerPage: paginate.get('itemsPerPage') })
	const page = paginate.get('page') > pages ? 0 : paginate.get('page')

	return (
		<div className="row">
			<div className="col">
				<ReactPaginate
					pageCount={pages}
					forcePage={page}
					pageRangeDisplayed={pageRange}
					marginPagesDisplayed={pageRange}
					activeClassName="active"
					breakClassName="page-item"
					breakLabel={<a className="page-link disabled">...</a>}
					containerClassName="pagination"
					nextClassName="page-item"
					nextLinkClassName="page-link"
					pageClassName="page-item"
					pageLinkClassName="page-link"
					previousClassName="page-item"
					previousLinkClassName="page-link"
					onPageChange={paginateTo}
				/>
			</div>

			<div className="col">
				<select
					className="form-control w-auto float-right"
					value={paginate.get('itemsPerPage')}
					onChange={({ target: { value } }) => {
						return setItemsPerPage(value)
					}}
				>
					{itemsPerPageOptions.map(items => {
						return (
							<option key={items} value={items}>
								{items} per page
							</option>
						)
					})}
				</select>
			</div>
		</div>
	)
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(PaginationControl)
