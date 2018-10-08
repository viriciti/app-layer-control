import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { isEmpty, omit, size } from 'underscore'
import classNames from 'classnames'

import { storeEnabledRegistryImages, refreshRegistryImages, removeUnavailableRegistryImage } from '../modules/actions'
import extractImageFromUrl from '../modules/extractImageFromUrl'

class RegistryImagesOverview extends PureComponent {
	state = {
		selectedImages: {},
	}

	componentDidUpdate (prevProps) {
		if (isEmpty(this.state.selectedImages) && prevProps.enabledRegistryImages !== this.props.enabledRegistryImages) {
			this.setState({ selectedImages: this.props.enabledRegistryImages.toJS() })
		}
	}

	onPublish = () => {
		if (isEmpty(this.state.selectedImages)) {
			return alert('No versions selected!')
		}

		if (!confirm(`Sending ${size(this.state.selectedImages)} enabled images. Are you sure?`)) {
			return
		}

		this.props.storeEnabledRegistryImages(this.state.selectedImages)
	}

	onRefresh = () => {
		this.props.refreshRegistryImages()
	}

	onVersionSelected = ({ name, version }) => {
		this.setState(prevState => {
			const { selectedImages } = prevState

			if (selectedImages[name] === version) {
				return { selectedImages: omit(selectedImages, name) }
			} else {
				return { selectedImages: { [name]: version } }
			}
		})
	}

	onRemoveImage = ({ name, image }) => {
		if (confirm(`Would you like to remove ${name} from the (allowed) images?`)) {
			this.props.removeUnavailableRegistryImage({ name, image })
		}
	}

	renderImages () {
		const renderVersions = (name, versions) => {
			return versions.map(version => {
				const isVersionPersisted = this.props.enabledRegistryImages.get(name) === version
				const isVersionSelected = this.state.selectedImages[name] === version

				return (
					<span
						className={classNames('label', 'font-weight-normal', 'd-inline-block', 'm-0', 'mr-2', {
							'label--primary': isVersionPersisted,
							'label--info':    isVersionSelected && !isVersionPersisted,
						})}
						key={version}
						onClick={() => {
							return this.onVersionSelected({ name, version })
						}}
					>
						{version}
					</span>
				)
			})
		}

		const renderNotExisting = name => {
			return (
				<p className="text-muted">
					<span className="fas fa-search fa-fw mr-2" /> Image not found in the repository.
					<button
						className="btn btn--text btn--icon float-right"
						title={`Remove ${name} from (allowed) registry images`}
						onClick={this.onRemoveImage.bind(null, { image: name, name: extractImageFromUrl(name) })}
					>
						<span className="fas fa-trash" />
					</button>
				</p>
			)
		}

		return this.props.registryImages.entrySeq().map(([name, image]) => {
			return (
				<tr key={name}>
					<td>{name}</td>
					<td>{image.get('exists') ? renderVersions(name, image.get('versions')) : renderNotExisting(name)}</td>
				</tr>
			)
		})
	}

	render () {
		return (
			<div className="card">
				<div className="card-header">
					Registry Images
					<div className="btn-group btn-group--toggle float-right">
						<button className="btn btn-sm btn-primary" onClick={this.onRefresh}>
							<span className="fas fa-download" /> Fetch versions
						</button>

						<button className="btn btn-sm btn-light" onClick={this.onPublish}>
							<span className="fas fa-cloud-upload-alt" /> Publish
						</button>
					</div>
				</div>
				<div className="card-body spacing-base">
					<table className="table">
						<thead className="thead-light">
							<tr>
								<th>Image</th>
								<th>Versions</th>
							</tr>
						</thead>
						<tbody>{this.renderImages()}</tbody>
					</table>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			enabledRegistryImages: state.get('enabledRegistryImages'),
			registryImages:        state.get('registryImages'),
		}
	},
	{ storeEnabledRegistryImages, refreshRegistryImages, removeUnavailableRegistryImage }
)(RegistryImagesOverview)
