import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class TableHead extends PureComponent {
	static propTypes = {
		onSort:      PropTypes.func,
		sortable:    PropTypes.bool,
		ascending:   PropTypes.bool,
		sorted:      PropTypes.bool,
		headerName:  PropTypes.string.isRequired,
		columnWidth: PropTypes.number,
	}

	getClassName () {
		if (this.props.sortable) {
			const base = ['th', 'th--sortable']

			if (this.props.sorted) {
				if (this.props.ascending) {
					base.push('ascending')
				} else {
					base.push('descending')
				}
			}

			return base.join(' ')
		} else {
			return 'th'
		}
	}

	getStyle () {
		if (this.props.columnWidth) {
			return { width: this.props.columnWidth }
		} else {
			return {}
		}
	}

	onSort = () => {
		if (this.props.sortable) {
			this.props.onSort()
		}
	}

	render () {
		return (
			<th className={this.getClassName()} onClick={this.onSort} style={this.getStyle()}>
				{this.props.headerName}
			</th>
		)
	}
}

export default TableHead
