import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'

import Advice from '/components/common/Advice'
import ConfigurationsList from './ConfigurationsList'
import ConfigurationInfo from './ConfigurationInfo'
import ConfigurationsForm from './ConfigurationsForm'
import getAsyncState from '/store/selectors/getAsyncState'
import getApplicationsWithNoDependents from '../../modules/selectors/advice/getApplicationsWithNoDependents'

class ConfigurationInfoMain extends PureComponent {
	state = {
		isAdding:              false,
		isEditing:             false,
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

	onAddApplication = () => {
		this.setState({ isAdding: true, isEditing: false })
	}

	onEditApplication = () => {
		this.setState({ isEditing: true, isAdding: false })
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
			isAdding:  false,
			isEditing: false,
			editing:   null,
		})
	}

	render () {
		return (
			<Fragment>
				<div className="card mb-3">
					<div className="card-header">
						Applications
						<Advice
							show={this.props.dependents.size}
							message={`${
								this.props.dependents.size
							} application(s) are not used and can be removed`}
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
								/>
							</div>
						)}
					</div>
				</div>

				<ConfigurationsForm
					isAdding={this.state.isAdding}
					isEditing={this.state.isEditing}
					editing={this.state.selectedConfiguration}
					onRequestClose={this.onRequestClose}
				/>
			</Fragment>
		)
	}
}

const mapStateToProps = state => {
	return {
		configurations:         state.get('configurations'),
		dependents:             getApplicationsWithNoDependents(state),
		isFetchingApplications: getAsyncState('isFetchingApplications')(state),
	}
}

export default connect(mapStateToProps)(ConfigurationInfoMain)
