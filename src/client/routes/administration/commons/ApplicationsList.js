import React, { PureComponent, Fragment } from 'react'
import classNames from 'classnames'
import { noop, omit, has } from 'underscore'
import naturalCompare from 'natural-compare-lite'

const ApplicationVersion = ({ version, onExpandSelectVersion, isCurrentVersion }) => {
	return (
		<li>
			<button
				type="button"
				onClick={onExpandSelectVersion}
				className={classNames('my-1', 'btn', 'btn-block', 'btn--select', 'btn--no-underline', {
					active: isCurrentVersion,
				})}
			>
				{version}
			</button>
		</li>
	)
}

const Application = ({ label }) => {
	return (
		<li>
			<button
				type="button"
				className="my-1 label label--disabled label--icon-absolute label--no-hover"
				title="The image for this application has not been synchronized yet"
			>
				{label}
				<span className="fas fa-ban text-danger fa-fw" />
			</button>
		</li>
	)
}

const AvailableApplication = ({ label, version, onToggle, onExpand, isSelected, isExpanded }) => {
	return (
		<li>
			<div className={classNames('btn-flex', 'my-1', { 'btn-group': isSelected })}>
				<button
					type="button"
					onClick={onToggle}
					className={classNames('btn', 'btn--select', 'btn--no-underline', {
						active:               isSelected,
						'btn--icon-absolute': isSelected && !version,
					})}
				>
					{isSelected && version ? `${label} @ ${version}` : label}
				</button>

				<button
					type="button"
					onClick={isSelected ? onExpand : noop}
					className={classNames('btn', 'btn--no-underline', {
						'btn-primary': isSelected,
						disabled:      !isSelected,
					})}
					title={
						!isSelected
							? 'You must select this application before you can select a version'
							: 'Lock this application to a specific version'
					}
				>
					{isExpanded ? <span className="fas fa-times" /> : <span className="fas fa-chevron-right" />}
				</button>
			</div>
		</li>
	)
}

class ApplicationsList extends PureComponent {
	state = {
		expandApplicationName: null,
	}

	removeApplication (name) {
		this.updateApplications(omit(this.props.input.value, name))
	}

	addApplication (name) {
		this.updateApplications({ ...this.props.input.value, [name]: null })
	}

	updateApplicationVersion (newVersion) {
		this.updateApplications({ ...this.props.input.value, [this.state.expandApplicationName]: newVersion })
	}

	updateApplications (updates) {
		const { onChange, onBlur } = this.props.input

		onChange(updates)
		onBlur(updates)
	}

	onToggle = name => {
		if (has(this.props.input.value, name)) {
			this.removeApplication(name)
			this.setState({ expandApplicationName: null })
		} else {
			this.addApplication(name)
			this.setState({ expandApplicationName: name })
		}
	}

	onExpand = name => {
		if (this.state.expandApplicationName === name) {
			this.setState({ expandApplicationName: null })
		} else {
			this.setState({ expandApplicationName: name })
		}
	}

	onExpandSelectVersion = version => {
		this.updateApplicationVersion(version)
	}

	onRemoveVersionLock = () => {
		this.updateApplicationVersion(null)
	}

	render () {
		return (
			<div className="form-group row">
				<label className="col-sm-2 col-form-label" htmlFor={this.props.input.name}>
					{this.props.label}
				</label>

				<div className="col-sm-10">
					<div className="row">
						<div className="col-6">
							<ul className="list-unstyled">
								{this.props.labels
									.sort((previous, next) => {
										return naturalCompare(previous.label, next.label)
									})
									.map(({ label, value, image }) => {
										if (this.props.registryImagesNames.includes(image)) {
											return (
												<AvailableApplication
													key={value}
													label={label}
													version={this.props.input.value[label]}
													onToggle={this.onToggle.bind(null, value)}
													onExpand={this.onExpand.bind(null, label)}
													isSelected={has(this.props.input.value, value)}
													isExpanded={this.state.expandApplicationName === label}
												/>
											)
										} else {
											return <Application key={value} label={label} />
										}
									})}
							</ul>
						</div>

						<div className="col-6">
							{this.state.expandApplicationName ? (
								<ul className="list-unstyled">
									{this.props.versionsPerApplication.get(this.state.expandApplicationName).map(version => {
										return (
											<ApplicationVersion
												key={`${this.state.expandApplicationName}${version}`}
												version={version}
												onExpandSelectVersion={this.onExpandSelectVersion.bind(null, version)}
												isCurrentVersion={this.props.input.value[this.state.expandApplicationName] === version}
											/>
										)
									})}

									{this.props.input.value[this.state.expandApplicationName] ? (
										<li>
											<button
												className="mt-3 btn btn-block btn-secondary btn-sm btn--no-underline"
												onClick={this.onRemoveVersionLock}
												title="Use semantic versioning from app configuration"
												type="button"
											>
												<span className="fas fa-unlock-alt" /> Remove version lock
											</button>
										</li>
									) : null}
								</ul>
							) : null}
						</div>
					</div>

					{this.props.meta.touched && this.props.meta.error && !this.props.meta.disabled ? (
						<span className="form-text text-danger">
							<span className="fas fa-exclamation-circle fa-fw" /> {this.props.meta.error}
						</span>
					) : this.props.helpText ? (
						<span className="form-text text-muted">
							<span className="fas fa-info-circle fa-fw" /> {this.props.helpText}
						</span>
					) : null}
				</div>
			</div>
		)
	}
}

export default ApplicationsList
