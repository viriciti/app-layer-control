import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'

import { refreshRegistryImages, removeUnavailableRegistryImage } from '../modules/actions'
import extractImageFromUrl from '../modules/extractImageFromUrl'
import AsyncButton from '../../../components/common/AsyncButton'

class RegistryImagesOverview extends PureComponent {
	state = {
		selectedImages: {},
	}

	onRefresh = () => {
		this.props.refreshRegistryImages()
	}

	onRemoveImage = ({ name, image }) => {
		if (confirm(`Would you like to remove ${name} from the (allowed) images?`)) {
			this.props.removeUnavailableRegistryImage({ name, image })
		}
	}

	renderImages () {
		const renderVersions = versions => {
			if (versions && versions.size) {
				return versions.map(version => {
					return (
						<span className="m-0 mr-3" key={version}>
							{version}
						</span>
					)
				})
			} else {
				return <i>No available versions</i>
			}
		}

		const renderNoAccess = name => {
			return (
				<p className="text-muted">
					<span className="fas fa-user-lock fa-fw mr-2" />
					No access to this image or image was not found in the repository.
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
					<td>{image.get('access') ? renderVersions(image.get('versions')) : renderNoAccess(name)}</td>
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
						<AsyncButton
							className="btn btn-sm btn-light btn--no-underline"
							onClick={this.onRefresh}
							busy={this.props.isFetchingVersions}
							busyText="Fetching ..."
						>
							<Fragment>
								<span className="fas fa-download" /> Fetch versions
							</Fragment>
						</AsyncButton>
					</div>
				</div>

				<div className="card-body spacing-base">
					{this.props.registryImages.size ? (
						<div className="table-responsive">
							<table className="table">
								<thead className="thead-light">
									<tr>
										<th>Image</th>
										<th>Available versions</th>
									</tr>
								</thead>
								<tbody>{this.renderImages()}</tbody>
							</table>
						</div>
					) : (
						<div className="card-message">No registry images available, try to fetch versions first</div>
					)}
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			registryImages:     state.get('registryImages'),
			isFetchingVersions: state.getIn(['userInterface', 'isFetchingVersions']),
		}
	},
	{ refreshRegistryImages, removeUnavailableRegistryImage }
)(RegistryImagesOverview)
