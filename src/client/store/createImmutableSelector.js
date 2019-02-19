import { createSelectorCreator, defaultMemoize } from 'reselect'
import { is } from 'immutable'

export default createSelectorCreator(defaultMemoize, is)
