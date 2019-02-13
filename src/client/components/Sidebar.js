import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

class Sidebar extends Component {
	state = {
		sidebarOpen: window.localStorage.getItem('sidebar-open') === 'true',
	}

	toggleSidebar = () => {
		this.setState(
			{
				sidebarOpen: !this.state.sidebarOpen,
			},
			() => {
				window.localStorage.setItem('sidebar-open', this.state.sidebarOpen)
			}
		)
	}

	render () {
		return (
			<nav className={this.state.sidebarOpen ? 'sidebar active' : 'sidebar'}>
				<ul className="sidebar__list">
					<li className="sidebar__toggle" onClick={this.toggleSidebar}>
						<a className="link--stripped">
							<span className="sidebar__toggle-icon fas fa-chevron-right" />
						</a>
					</li>
					<li className="sidebar__list-item">
						<NavLink exact activeClassName="active" to="/">
							<span className="sidebar__list-icon fas fa-hdd" />
							<span className="sidebar__list-label">Devices</span>
						</NavLink>
					</li>
					<li className="sidebar__list-item">
						<NavLink exact activeClassName="active" to="/administration">
							<span className="sidebar__list-icon fas fa-user-tie" />
							<span className="sidebar__list-label">Administration</span>
						</NavLink>
					</li>
					<li className="sidebar__list-item">
						<NavLink exact activeClassName="active" to="/sources">
							<span className="sidebar__list-icon fas fa-memory" />
							<span className="sidebar__list-label">Sources</span>
						</NavLink>
					</li>
				</ul>
			</nav>
		)
	}
}

export default Sidebar
