import React, { PureComponent, Fragment } from 'react'
import { Field, FieldArray, reduxForm } from 'redux-form/immutable'
import { Map, List } from 'immutable'
import { connect } from 'react-redux'
import { reduce } from 'lodash'
import { toast } from 'react-toastify'
import axios from 'axios'

import AsyncButton from '/components/common/AsyncButton'
import Modal from '/components/common/Modal'
import validate from '/routes/administration/modules/validateForm'

import {
	TextInput,
	VersionInput,
	SelectInput,
	DoubleTextInput,
	SliderInput,
} from '/routes/administration/commons'

const initialFormValues = {
	detached:      true,
	privileged:    false,
	networkMode:   'host',
	restartPolicy: 'Always restart',
	version:       '^1.0.0',
}

class ConfigurationsForm extends PureComponent {
	componentDidUpdate (prevProps) {
		if (
			(prevProps.isEditing && !this.props.isEditing) ||
			(prevProps.isCopying && !this.props.isCopying)
		) {
			this.props.initialize(initialFormValues)
		} else if (this.props.configuration) {
			if (!prevProps.isEditing && this.props.isEditing) {
				this.props.initialize({
					detached:   this.props.configuration.get('detached'),
					privileged: this.props.configuration.get('privileged'),
					...this.denormalizeGroupedValues(this.props.configuration).toJS(),
				})
			} else if (!prevProps.isCopying && this.props.isCopying) {
				this.props.initialize({
					detached:        this.props.configuration.get('detached'),
					privileged:      this.props.configuration.get('privileged'),
					...this.denormalizeGroupedValues(this.props.configuration).toJS(),
					applicationName: undefined,
					containerName:   undefined,
				})
			}
		}
	}

	denormalizeGroupedValues (values) {
		const mutationsByType = {
			environment: value => {
				return value.reduce((memo, environment, position) => {
					const [Name, Value] = environment.split('=')

					return memo.set(position, Map({ Name, Value }))
				}, List())
			},
			mounts: value => {
				return value.reduce((memo, mount, position) => {
					const [HostPath, ContainerPath] = mount.split(':')

					return memo.set(position, Map({ HostPath, ContainerPath }))
				}, List())
			},
			ports: value => {
				return value.reduce((memo, internal, external) => {
					const External = external.split('/')[0]
					const Internal = internal.getIn([0, 'HostPort'])

					return memo.push(Map({ External, Internal }))
				}, List())
			},
			restartPolicy: value => {
				switch (value) {
					case 'always':
						return 'Always restart'

					case 'no':
						return 'Do not automatically restart'

					case 'on-failure':
						return 'On failure'

					case 'unless-stopped':
						return 'If not explicitly stopped'
				}
			},
		}

		return values
			.entrySeq()
			.map(([type, value]) => {
				if (mutationsByType[type]) {
					return [type, mutationsByType[type](value)]
				} else {
					return [type, value]
				}
			})
			.reduce((mappedByKey, [key, value]) => {
				return mappedByKey.set(key, value)
			}, Map())
	}

	onSubmit = async newConfiguration => {
		const confirmMessage =
			this.props.isAdding || this.props.isCopying
				? 'A new configuration will be created. Are you sure?'
				: 'The configuration will be updated. Are you sure?'

		const configuration       = { ...newConfiguration }
		const { applicationName } = configuration
		const removeTrailingSlash = value => {
			return value.replace(/(.+)\/$/, '$1')
		}

		if (!confirm(confirmMessage)) {
			return
		}

		// normalize environment
		if (configuration.environment) {
			configuration.environment = configuration.environment.map(env => {
				return [env.Name, env.Value].join('=')
			})
		}

		// normalize ports
		if (configuration.ports) {
			configuration.ports = reduce(
				configuration.ports,
				(ports, port) => {
					return {
						...ports,
						[`${port.External}/tcp`]: [
							{
								HostPort: port.Internal,
							},
						],
					}
				},
				{}
			)
		}

		// normalize mounts
		if (configuration.mounts) {
			configuration.mounts = configuration.mounts.map(mount => {
				return [
					removeTrailingSlash(mount.HostPath),
					removeTrailingSlash(mount.ContainerPath),
				].join(':')
			})
		}

		if (configuration.restartPolicy === 'Do not automatically restart') {
			configuration.restartPolicy = 'no'
		} else if (configuration.restartPolicy === 'Always restart') {
			configuration.restartPolicy = 'always'
		} else if (configuration.restartPolicy === 'On failure') {
			configuration.restartPolicy = 'on-failure'
		} else if (configuration.restartPolicy === 'If not explicitly stopped') {
			configuration.restartPolicy = 'unless-stopped'
		}

		const { data } = await axios.put(
			`/api/v1/administration/application/${applicationName}`,
			configuration
		)

		this.props.onRequestClose()
		this.props.reset()

		toast.success(data.message)
	}

	getAvailableImages () {
		return this.props.registryImages.keySeq().toArray()
	}

	getInstallationSteps () {
		return [
			{ title: 'Pull', value: 'Pull' },
			{ title: 'Clean', value: 'Clean' },
			{ title: 'Create', value: 'Create' },
			{ title: 'Start', value: 'Start' },
		]
	}

	render () {
		return (
			<Modal
				visible={
					this.props.isAdding || this.props.isEditing || this.props.isCopying
				}
				title={
					this.props.isAdding || this.props.isCopying
						? 'Add Application'
						: 'Edit Application'
				}
				onClose={this.props.onRequestClose}
			>
				<form
					className="form-horizontal"
					onSubmit={this.props.handleSubmit(this.onSubmit.bind(this))}
				>
					<fieldset>
						<Field
							name="applicationName"
							label="Application name"
							component={TextInput}
							readOnly={this.props.isEditing}
							required
						/>
						<Field
							name="containerName"
							label="Container name"
							component={TextInput}
							required
						/>

						<Field
							name="fromImage"
							label="Image"
							component={SelectInput}
							options={this.getAvailableImages()}
							sortOnValue
							required
						/>
						<Field
							name="version"
							label="Version"
							component={VersionInput}
							required
						/>
						<Field
							name="frontEndPort"
							label="Front end port"
							component={TextInput}
							type="number"
							helpText="The application will be exposed at this port"
						/>
						<Field
							name="privileged"
							label="Privileged mode"
							component={SliderInput}
							helpText="Privileged mode grants this application elevated rights"
						/>
						<Field
							name="lastInstallStep"
							label="Last Install Step"
							component={SelectInput}
							options={this.getInstallationSteps()}
						/>
						<Field
							name="networkMode"
							label="Network mode"
							component={SelectInput}
							options={['bridge', 'host', 'none']}
						/>
						<Field
							name="restartPolicy"
							label="Restart policy"
							component={SelectInput}
							options={[
								'Do not automatically restart',
								'On failure',
								'If not explicitly stopped',
								'Always restart',
							]}
						/>
						<div className="row">
							<div className="col-4">
								<FieldArray
									name="environment"
									label="Environment"
									submitLabel="Add environment"
									component={DoubleTextInput}
									fieldsNames={{ first: 'Name', second: 'Value' }}
								/>
							</div>
							<div className="col-4">
								<FieldArray
									name="mounts"
									label="Mounts"
									submitLabel="Add mount"
									component={DoubleTextInput}
									fieldsNames={{ first: 'HostPath', second: 'ContainerPath' }}
								/>
							</div>
							<div className="col-4">
								<FieldArray
									name="ports"
									label="Ports"
									submitLabel="Add port"
									component={DoubleTextInput}
									fieldsNames={{ first: 'External', second: 'Internal' }}
								/>
							</div>
						</div>
						<div className="row">
							<div className="col-md-3 text-danger">
								{this.props.error && <strong>{this.props.error}</strong>}
							</div>
							<div className="col-md-12">
								<div className="btn-group float-right mt-2">
									<AsyncButton
										busy={this.props.submitting}
										className="btn btn-primary room-sm-right"
										type="submit"
										white
									>
										{this.props.isAdding || this.props.isCopying
											? 'Save'
											: 'Edit'}
									</AsyncButton>
									<button
										type="button"
										disabled={this.props.submitting}
										className="btn btn-secondary btn--icon"
										onClick={this.props.reset}
										title="Undo any changes"
									>
										Reset
									</button>
								</div>
							</div>
						</div>
					</fieldset>
				</form>
			</Modal>
		)
	}
}

const mapStateToProps = state => ({
	registryImages: state.get('registryImages'),
})

export default connect(mapStateToProps)(
	reduxForm({
		form:          'configurations',
		validate,
		initialValues: initialFormValues,
	})(ConfigurationsForm)
)
