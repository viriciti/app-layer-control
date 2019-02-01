import React from 'react'

import ConfigurationInfoMain from '/routes/administration/components/configuration/ConfigurationInfoMain'
import GroupsTable from '/routes/administration/components/GroupsTable'
import RegistryImagesOverview from '/routes/administration/components/RegistryImagesOverview'

const AdministrationMain = () => {
	return (
		<div className="mx-3 mb-4">
			<header className="dashboard-header">
				<i className="dashboard-header__icon fas fa-user-tie" />
				<div className="dashboard-header__titles-container">
					<h1 className="dashboard-header__title">Administration</h1>
					<h2 className="dashboard-header__subtitle">Handle administration for your devices</h2>
				</div>
			</header>
			<div className="row flex flex-grow">
				<div className="col-6">
					<ConfigurationInfoMain />
				</div>
				<div className="col-6">
					<GroupsTable />
				</div>
			</div>
			<div className="row">
				<div className="col-12">
					<RegistryImagesOverview />
				</div>
			</div>
		</div>
	)
}

export default AdministrationMain
