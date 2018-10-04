import { createSelector } from 'reselect'
import semver from 'semver'
import { Map } from 'immutable'

const getConfigurations = state => {
	return state.get('configurations')
}
const getApplications = state => {
	return state.get('applications')
}

const getAppsWithLatestVersion = (configurations, apps) => {
	if (configurations.size === 0 || apps.size === 0) {
		return []
	}

	let appsWithLatestVersion = configurations.entrySeq().map(config => {
		const app = config[1].get('fromImage')

		if (!apps.has(app)) {
			return
		}

		const semverRange = config[1].get('version')

		return Map({
			name:          config[0],
			latestVersion: semver.maxSatisfying(apps.get(app), semverRange),
		})
	})

	return appsWithLatestVersion.filter(app => {
		if (app) {
			return app
		}
	})
}

export default createSelector(getConfigurations, getApplications, getAppsWithLatestVersion)
