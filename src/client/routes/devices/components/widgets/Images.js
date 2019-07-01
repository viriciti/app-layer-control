import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import naturalCompare from 'natural-compare-lite'
import { List } from 'immutable'
import { defaultTo } from 'lodash'

function Image ({ name, version }) {
	version = defaultTo(version, <i>not parseable</i>)

	return (
		<li className="py-2">
			<b>Repository:</b> {name}, <b>version:</b> {version}
		</li>
	)
}

function Images ({ images }) {
	return (
		<Fragment>
			<h5>
				<span className="fab fa-docker" /> Images
			</h5>

			<hr />

			<ul className="list list--lines">
				{defaultTo(images, List()).sort(naturalCompare).map(tag => {
					const [name, version] = tag.split(':')

					return <Image key={tag} name={name} version={version} />
				})}
			</ul>
		</Fragment>
	)
}

Images.propTypes = {
	images: ImmutablePropTypes.listOf(PropTypes.string),
}

export default Images
