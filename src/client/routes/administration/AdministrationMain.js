import React from 'react'

import ConfigurationInfoMain from 'routes/administration/components/configuration/ConfigurationInfoMain'
import GroupsTable from 'routes/administration/components/GroupsTable'
import AllowedImages from 'routes/administration/components/AllowedImages'
import RegistryImagesOverview from 'routes/administration/components/RegistryImagesOverview'

const AdministrationMain = () => {
	return (
		<div className="mx-3 mb-4">
			<header className="dashboard-header">
				<i className="dashboard-header__icon fas fa-boxes" />
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
				<div className="col-lg-9">
					<RegistryImagesOverview />
				</div>
				<div className="col-3">
					<AllowedImages />
				</div>
			</div>
		</div>
	)
}

export default AdministrationMain
