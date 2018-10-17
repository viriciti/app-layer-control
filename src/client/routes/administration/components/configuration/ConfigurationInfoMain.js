import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'

import ConfigurationsList from './ConfigurationsList'
import ConfigurationInfo from './ConfigurationInfo'
import ConfigurationsForm from './ConfigurationsForm'

class ConfigurationInfoMain extends PureComponent {
	state = {
		isAdding:              false,
		isEditing:             false,
		selectedConfiguration: null,
	}

	componentDidUpdate (prevProps) {
		if (prevProps.configurations !== this.props.configurations && this.state.selectedConfiguration) {
			this.setState({
				selectedConfiguration: this.props.configurations.get(this.state.selectedConfiguration.get('applicationName')),
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
					<div className="card-header">Applications</div>
					<div className="card-body">
						<div className="row">
							<div className="mt-1 mb-3 ml-auto col-3">
								<button className="btn btn-primary float-right " onClick={this.onAddApplication}>
									<span className="fas fa-window-maximize" /> Add Application
								</button>
							</div>
						</div>

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
		configurations: state.get('configurations'),
	}
}

export default connect(mapStateToProps)(ConfigurationInfoMain)
