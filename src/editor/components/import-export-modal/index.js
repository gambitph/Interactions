/**
 * Internal deprendencies
 */

/**
 * External deprendencies
 */
import { getOrGenerateBlockAnchor } from '~interact/editor/util'
import { first } from 'lodash'

/**
 * WordPress deprendencies
 */
import {
	Modal, TextareaControl, Button,
} from '@wordpress/components'
import {
	useState, useEffect, useRef, useCallback,
} from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import { dispatch, useSelect } from '@wordpress/data'

const NOOP = () => {}

const ImportExportModal = props => {
	const {
		title = '',
		description = '',
		interaction = {},
		mode = 'interaction',
		timelineIndex = 0,
		importLabel = '',
		hasExport = false,
		onImport = NOOP,
		onClose = NOOP,
	} = props

	let processedCode = ''
	if ( hasExport ) {
		if ( mode === 'interaction' ) {
			processedCode = interaction
		} else if ( mode === 'timeline' ) {
			processedCode = interaction?.timelines?.[ timelineIndex ] || ''
		}
		processedCode = JSON.stringify( processedCode, null, 4 )
	}

	const [ text, setText ] = useState( processedCode )
	const textareaRef = useRef( null )

	const {
		getBlockNamesByClientId,
		getSelectedBlockClientId,
	} = useSelect( select => {
		return {
			getBlockNamesByClientId: select( 'core/block-editor' ).getBlockNamesByClientId,
			getSelectedBlockClientId: select( 'core/block-editor' ).getSelectedBlockClientId,
		}
	} )

	useEffect( () => {
		if ( textareaRef.current ) {
			textareaRef.current.select()
		}
	}, [] )

	const handleImport = useCallback( () => {
		let data

		// Attempt to parse the JSON text input.
		try {
			data = JSON.parse( text )
		} catch ( error ) {
			// Show an alert and log an error if the JSON is invalid.
			alert( __( 'The JSON being imported is not valid. Please check the console for more details.', 'interactions' ) ) // eslint-disable-line no-alert
			console.error( 'Interactions importing error:', error.message ) // eslint-disable-line no-console
			return
		}

		if ( mode === 'interaction' ) {
			let {
				type = '',
				target = null,
			} = data

			// If the currently selected block is valid, overwrite the interaction trigger.
			const clientId = getSelectedBlockClientId()
			if ( clientId ) {
				target = {
					type: 'block',
					value: getOrGenerateBlockAnchor( clientId, true ) || '',
					blockName: first( getBlockNamesByClientId( clientId ) ) || '',
				}
			}

			// Call the import callback and handle any potential errors.
			try {
				onImport( type, target, data )
			} catch ( error ) {
				// Show an alert and log an error if the Interaction import fails.
				alert( __( 'The Interaction JSON being imported is not valid. Please check the console for more details.', 'interactions' ) ) // eslint-disable-line no-alert
				console.error( 'Interactions importing error:', error.message ) // eslint-disable-line no-console
				return
			}

			// Close the import modal/dialog.
			onClose()

			// Show a success snackbar notice for Interaction import.
			dispatch( 'core/notices' ).createNotice(
				'success',
				__( 'Interaction successfully imported.', 'interactions' ),
				{
					type: 'snackbar',
					isDismissible: true,
					id: 'IMPORT_TIMELINE',
				}
			)
		} else if ( mode === 'timeline' ) {
			// If JSON has multiple timelines ( a whole interactin for instance),
			// select the one at timelineIndex.
			if ( data.timelines ) {
				data = data.timelines[ timelineIndex ]
			}

			// Call the import callback for the timeline and handle errors.
			try {
				onImport( timelineIndex, data )
			} catch ( error ) {
				// Show an alert and log an error if the Timeline import fails.
				alert( __( 'The Timeline JSON being imported is not valid. Please check the console for more details.', 'interactions' ) ) // eslint-disable-line no-alert
				console.error( 'Interactions importing error:', error.message ) // eslint-disable-line no-console
				return
			}

			// Close the import modal/dialog.
			onClose()

			// Show a success snackbar notice for Timeline import.
			dispatch( 'core/notices' ).createNotice(
				'success',
				__( 'Timeline successfully imported.', 'interactions' ),
				{
					type: 'snackbar',
					isDismissible: true,
					id: 'IMPORT_TIMELINE',
				}
			)
		}
	}, [ text, mode, timelineIndex, onImport, onClose, getSelectedBlockClientId, getBlockNamesByClientId ] )

	const handleCopy = () => {
		if ( ! navigator.clipboard ) {
			const textArea = document.createElement( 'textarea' )
			textArea.value = text
			document.body.appendChild( textArea )
			textArea.select()
			document.execCommand( 'copy' )
			document.body.removeChild( textArea )
		} else {
			navigator.clipboard.writeText( text )
		}
		// Show notice.
		dispatch( 'core/notices' ).createNotice(
			'success',
			__( 'Copied JSON to clipboard.', 'interactions' ),
			{
				type: 'snackbar',
				isDismissible: true,
				id: 'COPY_JSON',
			}
		)
	}

	return (
		<Modal
			title={ title }
			className="interact-import-export-modal"
			onRequestClose={ onClose }
		>
			<div className="interact-import-export-modal__wrapper">
				<div className="interact-import-export-modal__description">{ description }</div>
				<div className="interact-import-export-modal__textarea-label-wrapper">
					<div className="interact-import-export-modal__textarea-label">
						{ __( 'JSON Code', 'interactions' ) }
					</div>
					{ hasExport &&
						<Button
							className="interact-import-export-modal__export-button"
							variant="tertiary"
							size="small"
							onClick={ handleCopy }
						>
							{ __( 'Copy JSON to clipboard', 'interactions' ) }
						</Button>
					}
				</div>
				<TextareaControl
					__nextHasNoMarginBottom
					value={ text }
					onChange={ value => setText( value ) }
					rows={ 14 }
					ref={ textareaRef }
				/>
				{ importLabel &&
					<div className="interact-import-export-modal__import-button-wrapper">
						<Button
							className="interact-import-export-modal__import-button"
							variant="secondary"
							size="default"
							onClick={ handleImport }
						>
							{ importLabel }
						</Button>
					</div>
				}
			</div>
		</Modal>
	)
}

export default ImportExportModal
