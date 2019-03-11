import { createSelectorCreator, defaultMemoize } from 'reselect'
import { is } from 'immutable'

export default createSelectorCreator(
	defaultMemoize,
	(previous, next) => previous === next || is(previous, next)
)
