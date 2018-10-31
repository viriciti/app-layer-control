import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Map } from 'immutable'
import { isEmpty } from 'underscore'

import { addAllowedImage, removeAllowedImage } from '../modules/actions'

const AllowedImage = ({ name, removeAllowedImage }) => {
	return (
		<tr>
			<td>{name}</td>
			<td className="text-right">
				<button
					className="btn btn--text btn--icon"
					onClick={() => {
						removeAllowedImage(name)
					}}
					title={`Remove ${name}`}
				>
					<span className="fas fa-trash" />
				</button>
			</td>
		</tr>
	)
}

class AllowedImages extends Component {
	state = {
		disabled: false,
		value:    '',
	}

	clear = () => {
		this.setState({ value: '', disabled: false })
	}

	onChange = e => {
		this.setState({ value: e.target.value, disabled: this.props.allowedImages.includes(e.target.value.trim()) })
	}

	onAdd = e => {
		e.preventDefault()

		if (isEmpty(this.state.value)) {
			return
		}

		if (!confirm(`Would you like to add ${this.state.value} to the allowed images?`)) {
			return
		}

		this.props.addAllowedImage({ name: this.state.value })
		this.clear()
	}

	onRemove = name => {
		if (confirm(`Would you like to remove ${name} from the allowed images?`)) {
			this.props.removeAllowedImage({ name })
		}
	}

	render () {
		return (
			<div className="card mb-3">
				<div className="card-header">Allowed Images</div>

				<div className="card-body">
					<form onSubmit={this.onAdd}>
						<div className="input-group mb-3">
							<input
								className="form-control"
								type="text"
								placeholder="Name of the image"
								value={this.state.value}
								onChange={this.onChange}
							/>

							<div className="input-group-append">
								<button
									className="btn btn-primary btn--no-underline"
									disabled={this.state.disabled || !this.state.value}
								>
									<span className="fas fa-archive" /> Add Image
								</button>
							</div>
						</div>
					</form>

					{this.props.allowedImages.size ? (
						<table className="table">
							<thead className="thead-light">
								<tr>
									<th>Name</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{this.props.allowedImages.sort().map(name => {
									return (
										<AllowedImage
											key={name}
											name={name}
											removeAllowedImage={() => {
												this.onRemove(name)
											}}
										/>
									)
								})}
							</tbody>
						</table>
					) : null}
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			allowedImages: state.get('allowedImages', Map()),
		}
	},
	{ addAllowedImage, removeAllowedImage }
)(AllowedImages)
