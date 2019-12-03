import React, { PureComponent, Fragment } from 'react'
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { Map } from 'immutable'
import { connect } from 'react-redux'
import { initial, last } from 'lodash'
import { valid, gt } from 'semver'

import ImageOverview from './ImageOverview'
import getAsyncState from '/store/selectors/getAsyncState'

class DeviceImages extends PureComponent {
	state = {
		selectedImage:   null,
		selectedVersion: null,
	}

	onImageSelected = selectedImage => {
		if (selectedImage.equals(this.state.selectedImage)) {
			this.setState({ selectedImage: null, selectedVersion: null })
		} else {
			this.setState({ selectedImage, selectedVersion: null })
		}
	}

	onVersionSelected = version => {
		if (this.state.selectedVersion === version) {
			this.setState({ selectedVersion: null })
		} else {
			this.setState({
				selectedVersion: version,
			})
		}
	}

	groupImages () {
		if (!this.props.images) {
			return
		}

		return this.props.images
			.valueSeq()
			.map(image => {
				const parts   = image.get('name').split(':')
				const name    = initial(parts).join('')
				const version = last(parts)

				return Map({ name, version })
			})
			.sort((previous, next) => {
				return naturalCompare(previous.get('name'), next.get('name'))
			})
			.groupBy(image => {
				return image.get('name')
			})
	}

	renderImages () {
		const images = this.groupImages()

		if (!images || images.isEmpty()) {
			return (
				<span className="card-message card-message--vertical-only">No images on this device</span>
			)
		} else {
			return images.entrySeq().map(([name, image]) => {
				const selectedImage =
					this.state.selectedImage && this.state.selectedImage.first().get('name')
				const isActive      = name === selectedImage

				return (
					<li className="mb-2" key={name}>
						<button
							onClick={() => {
								return this.onImageSelected(image)
							}}
							className={classNames('btn', 'btn--select', { active: isActive })}
						>
							{name}
						</button>
					</li>
				)
			})
		}
	}

	renderImageVersions () {
		if (this.state.selectedImage) {
			return this.state.selectedImage
				.sort((previous, next) => {
					if (!valid(previous.get('version')) || !valid(next.get('version'))) {
						// Return -1 to have tagged versions appear at the far left
						// Return 0 to have them stay put
						// Return 1 to have tagged versions appear at the far right
						return 1
					} else {
						if (gt(previous.get('version'), next.get('version'))) {
							return 1
						} else {
							return 0
						}
					}
				})
				.map(image => {
					const isActive = this.state.selectedVersion === image.get('version')

					return (
						<button
							key={`${image.get('name')}${image.get('version')}`}
							className={classNames('btn', 'btn--select', 'mr-2', {
								active: isActive,
							})}
							onClick={() => {
								return this.onVersionSelected(image.get('version'))
							}}
						>
							{image.get('version')}
						</button>
					)
				})
		} else if (this.props.images && !this.props.images.isEmpty()) {
			return <span className="card-message">No image selected</span>
		}
	}

	renderImageOverview = () => {
		if (this.state.selectedImage) {
			if (this.state.selectedVersion) {
				const findByVersion = image => {
					return image.get('version') === this.state.selectedVersion
				}
				const findByName    = name => {
					return image => {
						return image.get('name') === `${name}:${this.state.selectedVersion}`
					}
				}
				const selectedImage = this.state.selectedImage.find(findByVersion)
				const image         = this.props.images.find(findByName(selectedImage.get('name')))

				return <ImageOverview selectedImage={image} selectedDevice={this.props.selectedDevice} />
			} else {
				return <span className="card-message">No version selected</span>
			}
		}
	}

	render () {
		return (
			<Fragment>
				<h5>
					<span className="fab fa-docker" /> Images
				</h5>

				<hr />

				<div className="row">
					{this.props.isFetchingDevice ? (
						<div className="col-12">
							<div className="loader" />
						</div>
					) : (
						<Fragment>
							<div className="col-md-4">
								<ul className="list-group">{this.renderImages()}</ul>
							</div>

							<div className="col-md-8">
								{this.renderImageVersions()}
								{this.renderImageOverview()}
							</div>
						</Fragment>
					)}
				</div>
			</Fragment>
		)
	}
}

export default connect((state, ownProps) => ({
	isFetchingDevice: getAsyncState(['isFetchingDevice', ownProps.selectedDevice])(state),
}))(DeviceImages)
