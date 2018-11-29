import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { List } from 'immutable'
import { partial } from 'underscore'

import AsyncButton from 'components/common/AsyncButton'
import RegistryImageForm from './RegistryImageForm'
import { refreshRegistryImages, addRegistryImage, removeRegistryImage } from 'routes/administration/modules/actions'

const RegistryImage = ({ name, versions, onRemoveImage }) => {
	return (
		<tr>
			<td>{name}</td>
			<td title={versions.toArray()}>{versions.size} available versions</td>
			<td className="text-right">
				<button className="btn btn--text btn--icon" onClick={onRemoveImage} title={`Remove image ${name}`}>
					<span className="fas fa-trash" />
				</button>
			</td>
		</tr>
	)
}

class RegistryImagesOverview extends PureComponent {
	withRegistryUrl = repository => {
		return `docker.viriciti.com/${repository}`
	}

	onRefresh = () => {
		this.props.refreshRegistryImages()
	}

	onRemoveImage = ({ name, image }) => {
		if (confirm(`Remove registry image ${name}?`)) {
			this.props.removeRegistryImage({ name, image })
		}
	}

	onAddImage = ({ name }) => {
		if (confirm(`Add registry image ${name}?`)) {
			this.props.addRegistryImage({ name })
		}
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
					<RegistryImageForm imageNames={this.props.allowedImages} onSubmit={this.onAddImage} />

					{this.props.allowedImages.size ? (
						<div className="table-responsive">
							<table className="table">
								<thead className="thead-light">
									<tr>
										<th style={{ width: '30%' }}>Image</th>
										<th>Versions</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{this.props.allowedImages.sort().map(name => {
										return (
											<RegistryImage
												key={name}
												name={this.withRegistryUrl(name)}
												versions={this.props.registryImages.getIn([`docker.viriciti.com/${name}`, 'versions'], List())}
												onRemoveImage={partial(this.onRemoveImage, { name, image: this.withRegistryUrl(name) })}
											/>
										)
									})}
								</tbody>
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
			allowedImages:      state.get('allowedImages', List()),
			registryImages:     state.get('registryImages'),
			isFetchingVersions: state.getIn(['userInterface', 'isFetchingVersions']),
		}
	},
	{ refreshRegistryImages, addRegistryImage, removeRegistryImage }
)(RegistryImagesOverview)
