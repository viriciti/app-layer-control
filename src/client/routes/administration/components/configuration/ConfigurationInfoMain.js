import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'

import Advice from '/components/common/Advice'
import ConfigurationsList from './ConfigurationsList'
import ConfigurationInfo from './ConfigurationInfo'
import ConfigurationsForm from './ConfigurationsForm'
import getAsyncState from '/store/selectors/getAsyncState'
import getRemovableApplications from '../../modules/selectors/advice/getRemovableApplications'

class ConfigurationInfoMain extends PureComponent {
	state = {
		action:                null,
		configuration:         null,
		selectedConfiguration: null,
	}

	componentDidUpdate (prevProps) {
		if (
			prevProps.configurations !== this.props.configurations &&
			this.state.selectedConfiguration
		) {
			this.setState({
				selectedConfiguration: this.props.configurations.get(
					this.state.selectedConfiguration.get('applicationName')
				),
			})
		}
	}

	onCopyApplication = () => {
		this.setState({ action: 'copy' })
	}

	onAddApplication = () => {
		this.setState({ action: 'add' })
	}

	onEditApplication = () => {
		this.setState({ action: 'edit' })
	}

	onConfigurationSelected = selectedConfiguration => {
		if (selectedConfiguration === this.state.selectedConfiguration) {
			this.setState({ selectedConfiguration: null })
		} else {
			this.setState({ selectedConfiguration })
		}
	}

	onRequestClose = () => {
		this.setState({
			action:        null,
			configuration: null,
		})
	}

	render () {
		return (
			<Fragment>
				<div className="card mb-3">
					<div className="card-header">
						Applications
						<Advice
							forceHide={this.props.isFetchingApplications}
							size={this.props.removableApplications.size}
							items={this.props.removableApplications}
							message="{} are not used and can be removed"
						/>
					</div>

					<div className="card-controls card-controls--transparent">
						<button
							className="btn btn-light btn-sm  float-right"
							disabled={this.props.isFetchingApplications}
							onClick={this.onAddApplication}
						>
							<span className="fas fa-plus-circle mr-1" /> Add Application
						</button>
					</div>

					<div className="card-body">
						{this.props.isFetchingApplications ? (
							<div className="loader" />
						) : (
							<div className="row pl-3">
								<ConfigurationsList
									configurations={this.props.configurations}
									onConfigurationSelected={this.onConfigurationSelected}
									selectedConfiguration={this.state.selectedConfiguration}
								/>

								<ConfigurationInfo
									selectedConfiguration={this.state.selectedConfiguration}
									onEditApplication={this.onEditApplication}
									onCopyApplication={this.onCopyApplication}
								/>
							</div>
						)}
					</div>
				</div>

				<ConfigurationsForm
					isAdding={this.state.action === 'add'}
					isEditing={this.state.action === 'edit'}
					isCopying={this.state.action === 'copy'}
					configuration={this.state.selectedConfiguration}
					onRequestClose={this.onRequestClose}
				/>
			</Fragment>
		)
	}
}

const mapStateToProps = state => {
	return {
		configurations:         state.get('configurations'),
		removableApplications:  getRemovableApplications(state),
		isFetchingApplications: getAsyncState('isFetchingApplications')(state),
	}
}

export default connect(mapStateToProps)(ConfigurationInfoMain)
