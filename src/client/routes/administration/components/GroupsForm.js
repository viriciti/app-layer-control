import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form/immutable'

import Modal from '../../../components/common/Modal'
import ApplicationsList from '../commons/ApplicationsList'
import ApplicationsTextInput from '../commons/ApplicationsTextInput'
import getGroupsNames from '../modules/selectors/getGroupsNames'
import getRegistryImagesNames from '../modules/selectors/getRegistryImagesNames'
import validate from '../modules/validateGroupsForm'
import { createGroup } from '../modules/actions/index'
import extractImageFromUrl from '../modules/extractImageFromUrl'

const initialFormValues = {
	applications: [],
}

class GroupsForm extends PureComponent {
	componentWillReceiveProps (nextProps) {
		if (this.props.isEditing && !nextProps.isEditing) {
			this.props.initialize(initialFormValues)
		} else if (!this.props.isEditing && nextProps.isEditing) {
			this.props.initialize({
				label:        nextProps.editing.get('label'),
				applications: nextProps.editing.get('applications').toArray(),
			})
		}
	}

	getLabels () {
		return this.props.configurations
			.map(config => {
				const appName = config.get('applicationName')

				return {
					value: appName,
					label: appName,
					image: extractImageFromUrl(config.get('fromImage')),
				}
			})
			.toArray()
	}

	onRequestClose = () => {
		this.props.reset()
		this.props.onRequestClose()
	}

	onSubmit = ({ label, applications }) => {
		this.props.createGroup({ label, applications })
		this.onRequestClose()
	}

	render () {
		return (
			<Modal
				title={this.props.isAdding ? 'Add group' : 'Edit group'}
				visible={this.props.isAdding || this.props.isEditing}
				onClose={this.onRequestClose}
			>
				<form onSubmit={this.props.handleSubmit(this.onSubmit.bind(this))}>
					<Field name="label" label="Label" component={ApplicationsTextInput} type="text" />
					<Field
						registryImagesNames={this.props.registryImagesNames}
						component={ApplicationsList}
						helpText="Leave unselected to create an empty group."
						label="Applications"
						labels={this.getLabels()}
						name="applications"
					/>

					<div className="form-group btn-group float-right">
						<button className="btn btn-primary">{this.props.isAdding ? 'Add Group' : 'Edit Group'}</button>
						<button className="btn btn-secondary" type="button" onClick={this.onRequestClose}>
							Cancel
						</button>
					</div>
				</form>
			</Modal>
		)
	}
}
export default connect(
	state => {
		return {
			registryImagesNames: getRegistryImagesNames(state),
			configurations:      state.get('configurations'),
			groupsLabels:        getGroupsNames(state),
		}
	},
	{ createGroup }
)(
	reduxForm({
		enableReinitialize:      true,
		form:                    'groupsForm',
		initialValues:           initialFormValues,
		keepDirtyOnReinitialize: true,
		validate,
	})(GroupsForm)
)
