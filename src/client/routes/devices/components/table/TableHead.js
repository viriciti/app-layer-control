import React, { PureComponent } from 'react'

class TableHead extends PureComponent {
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

	onClick = () => {
		if (!this.props.sortable) return
		this.props.onClick()
	}

	render () {
		return (
			<th className={this.getClassName()} style={this.props.headerStyle || {}} onClick={this.onClick}>
				{this.props.headerName}
			</th>
		)
	}
}

export default TableHead
