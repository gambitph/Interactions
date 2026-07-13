import IconSVG from '~interact/editor/assets/icon.svg'

import { ToolbarButton } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { useDispatch } from '@wordpress/data'

const AddInteractionButton = () => {
	// Interaction library open modal and set target function
	const {
		setMode: setInteractionLibraryMode,
	} = useDispatch( 'interact/interaction-library-modal' )

	return (
		<>
			<ToolbarButton
				onClick={ () => {
					setInteractionLibraryMode( 'insert' )
				} }
				onMouseDown={ ev => ev.preventDefault() }
				onKeyDown={ ev => {
					if ( ev.key === 'Enter' || ev.key === ' ' ) {
						setInteractionLibraryMode( 'insert' )
						ev.preventDefault()
					}
				} }
				className="interact-insert-library-button"
				icon={ <IconSVG width="20" height="20" /> }
			>
				{ __( 'Interactions', 'interactions' ) }
			</ToolbarButton>
		</>
	)
}

export default AddInteractionButton
