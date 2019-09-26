import React, { Fragment, useEffect, useState } from 'react'
import { uniqueId, first } from 'lodash'

function readTextFile (file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('error', reject)
		reader.addEventListener('loadend', event => resolve(event.currentTarget.result))

		reader.readAsText(file)
	})
}

function FileInput ({ input, label }) {
	const [id]                    = useState(uniqueId())
	const [file, setSelectedFile] = useState()
	const onSelectFile            = event => setSelectedFile(first(event.target.files))

	useEffect(() => {
		if (file) {
			readTextFile(file).then(text => input.onChange(text))
		} else {
			input.onChange('')
		}
	}, [file])

	return (
		<div className="form-group row">
			<label className="col-sm-2 col-form-label" htmlFor={input.name}>
				{label}
			</label>

			<div className="col-sm-10">
				<div className="custom-file">
					<input
						accept=".csv"
						className="custom-file-input"
						id={id}
						onChange={onSelectFile}
						type="file"
					/>
					<label className="custom-file-label" htmlFor={id}>
						{file ? (
							<Fragment>
								<span className="fad fa-file mr-1" /> {file.name}
							</Fragment>
						) : (
							'Choose file'
						)}
					</label>
				</div>
			</div>
		</div>
	)
}

export default FileInput
