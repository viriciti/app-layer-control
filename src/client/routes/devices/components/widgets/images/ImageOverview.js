import React, { Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'

import { asyncRemoveImage } from '/routes/devices/actions/index'

const ImageOverview = ({ selectedImage, selectedDevice, asyncRemoveImage }) => {
	const onRemoveImage = () => {
		if (confirm('The image will be removed. Are you sure?')) {
			asyncRemoveImage(
				selectedDevice,
				selectedImage
					.get('id')
					.split(':')
					.slice(1)
					.join('')
			)
		}
	}

	return (
		<Fragment>
			<h5>
				<b>{selectedImage.get('name')}</b>
			</h5>

			<JSONPretty id="json-pretty" json={selectedImage.toJS()} />

			<button
				className="btn btn-danger btn--icon float-right my-3"
				type="button"
				onClick={onRemoveImage}
			>
				<span className="fas fa-trash" />
			</button>
		</Fragment>
	)
}

export default connect(
	state => {
		return {
			devices: state.get('devices'),
		}
	},
	{ asyncRemoveImage }
)(ImageOverview)
