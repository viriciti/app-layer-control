import DevicesRoute from './devices'
import AdministrationRoute from './administration'
import SourcesRoute from './sources'

export default () => {
	return [DevicesRoute, AdministrationRoute, SourcesRoute]
}
