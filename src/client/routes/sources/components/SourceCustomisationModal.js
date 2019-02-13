import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { getFormValues, reduxForm, Field } from 'redux-form/immutable'
import { without, omit } from 'lodash'

import Modal from '/components/common/Modal'
import { TextInput, ToggleInput, TextInputWithPreview, ToggleEntry } from '/routes/sources/commons'
import validate from '/routes/sources/modules/validateForm'

const initialFormValues = {
	entry: [],
}

const EntryFields = ({ input: { value, onChange, onBlur }, meta: { touched, error, disabled } }) => {
	const onToggleEntry = type => {
		if (value.includes(type)) {
			onChange(without(value, type))
		} else {
			onChange(value.concat([type]))
		}
	}

	const onToggleBlur = () => {
		onBlur(value)
	}

	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label">Entry</label>

			<div className="col-sm-10">
				<ToggleEntry
					name="entryInTable"
					toggleLabel="Table"
					checked={value.includes('table')}
					onChange={onToggleEntry.bind(null, 'table')}
					onBlur={onToggleBlur}
				/>
				<ToggleEntry
					name="entryInDetail"
					toggleLabel="Detail"
					checked={value.includes('detail')}
					onChange={onToggleEntry.bind(null, 'detail')}
					onBlur={onToggleBlur}
				/>

				{touched && error && !disabled ? (
					<span className="form-text text-danger">
						<span className="fas fa-exclamation-circle fa-fw" /> {error}
					</span>
				) : null}
			</div>
		</div>
	)
}

class SourceCustomisationModal extends PureComponent {
	componentDidUpdate (prevProps) {
		if (prevProps.isEditing && !this.props.editing) {
			this.props.initialize(initialFormValues)
		} else if (this.props.isEditing && !prevProps.editing && this.props.editing) {
			this.props.initialize({
				entry: [
					this.props.editing.get('entryInTable') ? 'table' : '',
					this.props.editing.get('entryInDetail') ? 'detail' : '',
				],
				columnIndex:  this.props.editing.get('columnIndex'),
				getIn:        this.props.editing.get('getIn'),
				defaultValue: this.props.editing.get('defaultValue'),
				headerName:   this.props.editing.get('headerName'),
				sortable:     this.props.editing.get('sortable'),
				filterable:   this.props.editing.get('filterable'),
				copyable:     this.props.editing.get('copyable'),
			})
		}
	}

	normalizeEntry (values) {
		const entryInTable = values.entry.includes('table')
		const entryInDetail = values.entry.includes('detail')

		return { ...omit(values, 'entry'), entryInTable, entryInDetail }
	}

	onRequestClose = () => {
		this.props.onRequestClose()
	}

	onSubmit = values => {
		values = this.normalizeEntry(values)

		if (this.props.isAdding) {
			this.props.onSubmitAdd(values)
		} else if (this.props.isEditing) {
			this.props.onSubmitEdit(values)
		}

		this.onRequestClose()
	}

	renderForm () {
		return (
			<form onSubmit={this.props.handleSubmit(this.onSubmit.bind(this))}>
				<Field name="entry" label="Entry" component={EntryFields} />

				<Field
					name="headerName"
					label="Label"
					component={TextInput}
					type="text"
					helpText={this.props.isEditing ? 'Changing the header name will not affect the name in the preview' : null}
				/>
				<Field
					name="getIn"
					label="Source"
					component={TextInput}
					type="text"
					helpText="Nested properties are separated by a dot"
				/>
				<Field
					name="defaultValue"
					label="Placeholder"
					component={TextInput}
					type="text"
					helpText="If the source is not found, show this value"
				/>

				{this.props.formValues && this.props.formValues.entry.includes('table') ? (
					<Fragment>
						<Field
							name="columnIndex"
							label="Position"
							placeholder="Place the source in this position"
							component={TextInputWithPreview}
							type="number"
							min="0"
							previewAvailable={this.props.isEditing}
							deviceSources={this.props.deviceSources}
							deviceSource={this.props.editing}
						/>
						<Field name="sortable" label="Sortable" component={ToggleInput} type="checkbox" />
						<Field name="filterable" label="Filterable" component={ToggleInput} type="checkbox" />
						<Field name="copyable" label="Copyable" component={ToggleInput} type="copyable" />
					</Fragment>
				) : null}

				<div className="form-group btn-group float-right">
					<button className="btn btn-primary">{this.props.isAdding ? 'Add' : 'Save changes'}</button>
					<button className="btn btn-secondary" type="button" onClick={this.onRequestClose}>
						Cancel
					</button>
				</div>
			</form>
		)
	}

	render () {
		return (
			<Modal
				onClose={this.onRequestClose}
				title={this.props.isEditing ? this.props.editing.get('headerName') : 'Add column'}
				visible={this.props.isOpen}
				wide
			>
				{this.renderForm()}
			</Modal>
		)
	}
}

export default connect(state => {
	return {
		formValues: getFormValues('deviceSources')(state),
	}
})(
	reduxForm({
		enableReinitialize:      true,
		form:                    'deviceSources',
		initialValues:           initialFormValues,
		keepDirtyOnReinitialize: true,
		validate,
	})(SourceCustomisationModal)
)
