import PropTypes from 'prop-types'
import React from 'react'
import ReactModal from 'react-modal'
import classNames from 'classnames'

const modalStyling = {
	overlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		top:             0,
		zIndex:          9999,
	},
	content: {
		backgroundColor: 'transparent',
		border:          0,
		marginTop:       '3.375rem',
		overflow:        'hidden',
		padding:         0,
	},
}

function Modal ({
	children,
	headerClassName,
	onClose,
	title,
	visible,
	wide,
	cursor,
}) {
	return (
		<ReactModal
			className={classNames('mx-auto', { 'col-6': !wide, 'col-10': wide })}
			contentLabel={title}
			isOpen={visible}
			shouldCloseOnOverlayClick
			onRequestClose={onClose}
			style={modalStyling}
		>
			<div className="card border-0 rounded-0">
				<div className={classNames('card-header', 'rounded-0', headerClassName)}>
					<div className="row">
						<div className="col-sm-4">{title}</div>
						<div className="col-sm-4 text-center">{cursor}</div>
						<div className="col-sm-4 float-right">
							<button className="close" aria-label="Close" onClick={onClose}>
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
					</div>
				</div>
				<div
					className="card-body p-4"
					style={{
						maxHeight: '80vh',
						overflowY: 'scroll',
						overflowX: 'hidden',
					}}
				>
					{children}
				</div>
			</div>
		</ReactModal>
	)
}

Modal.propTypes = {
	children:        PropTypes.node,
	headerClassName: PropTypes.string,
	onClose:         PropTypes.func.isRequired,
	title:           PropTypes.string.isRequired,
	visible:         PropTypes.bool.isRequired,
	wide:            PropTypes.bool,
}

export default Modal
