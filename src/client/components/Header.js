import React, { PureComponent, Fragment } from 'react'
import { Link } from 'react-router-dom'

class Header extends PureComponent {
	state = {
		noLogo: false,
	}

	onLoadError = () => {
		this.setState({ noLogo: true })
	}

	render () {
		return (
			<nav className="navbar navbar-dark fixed-top">
				<Link className="navbar-brand" to="/">
					{this.state.noLogo ? (
						<Fragment>
							<span className="fad fa-broadcast-tower mr-2" />
							<span className="navbar-brand--no-logo">App Layer Control</span>
						</Fragment>
					) : (
						<img src="/assets/logo/logo.png" onError={this.onLoadError} />
					)}
				</Link>
			</nav>
		)
	}
}

export default Header
