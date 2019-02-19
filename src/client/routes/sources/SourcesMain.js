import React from 'react'

import SourceCustomisation from './components/SourceCustomisation'

const SourcesMain = () => {
	return (
		<div className="mx-3 mb-4">
			<header className="dashboard-header">
				<i className="dashboard-header__icon fas fa-puzzle-piece" />
				<div className="dashboard-header__titles-container">
					<h1 className="dashboard-header__title">Sources</h1>
					<h2 className="dashboard-header__subtitle">Customize the sources</h2>
				</div>
			</header>
			<div className="row flex flex-grow">
				<div className="col">
					<SourceCustomisation />
				</div>
			</div>
		</div>
	)
}

export default SourcesMain
