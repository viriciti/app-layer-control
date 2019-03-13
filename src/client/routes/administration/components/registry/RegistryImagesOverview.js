import React, { PureComponent, Fragment } from 'react'
import axios from 'axios'
import { Map } from 'immutable'
import { connect } from 'react-redux'
import { partial } from 'lodash'

import AsyncButton from '/components/common/AsyncButton'
import RegistryImageForm from './RegistryImageForm'
import {
	fetchRegistry,
	asyncRefreshRegistry,
	asyncRemoveRegistryImage,
	asyncAddRegistryImage,
} from '/routes/administration/modules/actions'
import getAsyncState from '/store/selectors/getAsyncState'

const RegistryImage = ({ name, image, onRemoveImage, isRemovingAny }) => {
	return (
		<tr>
			<td>{name}</td>
			{image.get('access') ? (
				<td title={image.get('versions').toArray()}>
					{image.get('versions').size} available versions
				</td>
			) : (
				<td className="text-muted">
					<span className="fas fa-user-lock fa-fw mr-2" />
					No access to this image or image was not found in the repository.
				</td>
			)}

			<td className="text-right">
				<button
					className="btn btn--text btn--icon"
					onClick={onRemoveImage}
					title={`Remove image ${name}`}
					disabled={isRemovingAny}
				>
					<span className="fas fa-trash" />
				</button>
			</td>
		</tr>
	)
}

class RegistryImagesOverview extends PureComponent {
	state = {
		configuredHost: undefined,
		isRefreshing:   false,
	}

	async componentWillMount () {
		const { data } = await axios.get('/api/versioning')

		this.setState({ configuredHost: data.data.host })
	}

	componentDidMount () {
		this.props.fetchRegistry()
	}

	withRegistryUrl = repository => {
		const configuredHost = this.state.configuredHost
		const registryUrl    = configuredHost.endsWith('/')
			? configuredHost
			: configuredHost.concat('/')

		return `${registryUrl}${repository}`
	}

	onRefresh = async () => {
		this.props.asyncRefreshRegistry()
	}

	onRemoveImage = ({ name }) => {
		if (confirm(`Remove registry image ${name}?`)) {
			this.props.asyncRemoveRegistryImage(name)
		}
	}

	onAddImage = ({ name }) => {
		if (confirm(`Add registry image ${name}?`)) {
			this.props.asyncAddRegistryImage(name)
		}
	}

	render () {
		if (!this.state.configuredHost) {
			return null
		} else {
			return (
				<div className="card">
					<div className="card-header">
						Registry Images
						<div className="btn-group btn-group--toggle float-right">
							<AsyncButton
								className="btn btn-sm btn-light btn--no-underline"
								onClick={this.onRefresh}
								busy={this.props.isRefreshingRegistry}
								busyText="Fetching ..."
							>
								<Fragment>
									<span className="fas fa-download" /> Fetch versions
								</Fragment>
							</AsyncButton>
						</div>
					</div>

					<div className="card-body spacing-base">
						{this.props.isFetchingRegistry ? (
							<div className="loader" />
						) : (
							<Fragment>
								<RegistryImageForm
									imageNames={this.props.allowedImages}
									onSubmit={this.onAddImage}
								/>

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
															image={this.props.registryImages.get(
																this.withRegistryUrl(name),
																Map()
															)}
															onRemoveImage={partial(this.onRemoveImage, {
																name,
																image: this.withRegistryUrl(name),
															})}
															isRemovingAny={this.props.isRemovingRegistryImage}
														/>
													)
												})}
											</tbody>
										</table>
									</div>
								) : (
									<div className="card-message">
										No registry images available, try to fetch versions first
									</div>
								)}
							</Fragment>
						)}
					</div>
				</div>
			)
		}
	}
}

export default connect(
	state => {
		return {
			allowedImages:           state.get('allowedImages'),
			registryImages:          state.get('registryImages'),
			isFetchingVersions:      getAsyncState('isFetchingVersions')(state),
			isFetchingRegistry:      getAsyncState('isFetchingRegistry')(state),
			isRemovingRegistryImage: getAsyncState('isRemovingRegistryImage')(state),
			isRefreshingRegistry:    getAsyncState('isRefreshingRegistry')(state),
		}
	},
	{
		fetchRegistry,
		asyncRefreshRegistry,
		asyncRemoveRegistryImage,
		asyncAddRegistryImage,
	}
)(RegistryImagesOverview)
