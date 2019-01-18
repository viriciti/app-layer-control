import React, { PureComponent } from 'react'

class Footer extends PureComponent {
	state = {
		version: undefined,
	}

	componentWillMount () {
		fetch('/api/version')
			.then(response => {
				return response.json()
			})
			.then(({ version }) => {
				return this.setState({ version })
			})
	}

	render () {
		if (!this.state.version) {
			return null
		} else {
			return (
				<footer>
					<div className="row">
						<div className="mt-1 mb-3 mx-3 col-3 ml-auto">
							<small className="text-muted text-right float-right">v{this.state.version}</small>
						</div>
					</div>
				</footer>
			)
		}
	}
}

export default Footer
