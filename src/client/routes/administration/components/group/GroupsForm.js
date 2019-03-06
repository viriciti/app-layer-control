import React, { PureComponent } from 'react'
import axios from 'axios'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form/immutable'
import { toast } from 'react-toastify'

import ApplicationsList from '/routes/administration/commons/ApplicationsList'
import ApplicationsTextInput from '/routes/administration/commons/ApplicationsTextInput'
import Modal from '/components/common/Modal'
import countDevicesPerGroup from '/routes/administration/modules/selectors/countDevicesPerGroup'
import extractImageFromUrl from '/routes/administration/modules/extractImageFromUrl'
import getGroupsNames from '/routes/administration/modules/selectors/getGroupsNames'
import getRegistryImagesNames from '/routes/administration/modules/selectors/getRegistryImagesNames'
import getVersionPerGroupApplication from '/routes/administration/modules/selectors/getVersionPerGroupApplication'
import getVersionsPerApplication from '/routes/administration/modules/selectors/getVersionsPerApplication'
import validate from '/routes/administration/modules/validateGroupsForm'
import { createGroup } from '/routes/administration/modules/actions/index'

const initialFormValues = {
	applications: {},
}

class GroupsForm extends PureComponent {
	componentWillReceiveProps (nextProps) {
		if (
			(this.props.isAdding || this.props.isEditing) &&
			!this.props.hasDefaultGroup
		) {
			this.props.change('label', 'default')
		}

		if (this.props.isEditing && !nextProps.isEditing) {
			this.props.initialize(initialFormValues)
		} else if (!this.props.isEditing && nextProps.isEditing) {
			this.props.initialize({
				label:        nextProps.editing.get('label'),
				applications: nextProps.editing.get('applications').toJS(),
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
					image: extractImageFromUrl(config.get('fromImage', '')),
				}
			})
			.toArray()
	}

	onRequestClose = () => {
		this.props.reset()
		this.props.onRequestClose()
	}

	onSubmit = async ({ label, applications }) => {
		if (this.props.isEditing) {
			const affectingCount = this.props.devicesCountPerGroup.get(
				this.props.editing.get('label')
			)

			if (
				affectingCount &&
				!confirm(
					`Editing this group will affect ${affectingCount} devices, are you sure?`
				)
			) {
				return
			}
		}

		const { status, data } = await axios.put(
			`/api/v1/administration/group/${label}`,
			{ label, applications }
		)
		if (status !== 200) {
			toast.error(data.message)
		} else {
			toast.success(data.message)
			this.props.onRequestClose()
		}
	}

	render () {
		return (
			<Modal
				title={this.props.isAdding ? 'Add group' : 'Edit group'}
				visible={this.props.isAdding || this.props.isEditing}
				onClose={this.onRequestClose}
			>
				<form onSubmit={this.props.handleSubmit(this.onSubmit.bind(this))}>
					<Field
						name="label"
						label="Name"
						component={ApplicationsTextInput}
						type="text"
						disabled={!this.props.hasDefaultGroup || this.props.isEditing}
						helpText={
							!this.props.hasDefaultGroup ? 'This group is mandatory.' : ''
						}
					/>
					<Field
						groupName={this.props.editing && this.props.editing.get('label')}
						registryImagesNames={this.props.registryImagesNames}
						versionsPerApplication={this.props.versionsPerApplication}
						versionPerGroupApplication={this.props.versionPerGroupApplication}
						component={ApplicationsList}
						helpText="Leave unselected to create an empty group."
						label="Applications"
						labels={this.getLabels()}
						name="applications"
					/>

					<div className="form-group btn-group float-right">
						<button className="btn btn-primary">
							{this.props.isAdding ? 'Add Group' : 'Edit Group'}
						</button>
						<button
							className="btn btn-secondary"
							type="button"
							onClick={this.onRequestClose}
						>
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
			registryImagesNames:        getRegistryImagesNames(state),
			versionPerGroupApplication: getVersionPerGroupApplication(state),
			versionsPerApplication:     getVersionsPerApplication(state),
			configurations:             state.get('configurations'),
			groupsLabels:               getGroupsNames(state),
			devicesCountPerGroup:       countDevicesPerGroup(state),
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
