import IconSVG from '~interact/editor/assets/icon.svg'
import { openInteractionsSidebar } from '~interact/editor/editors'

import { ToolbarButton } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { useDispatch } from '@wordpress/data'

const AddInteractionButton = () => {
	// Interaction library open modal and set target function
	const {
		setMode: setInteractionLibraryMode,
	} = useDispatch( 'interact/interaction-library-modal' )

	const openInteractionLibrary = () => {
		openInteractionsSidebar()
		setInteractionLibraryMode( 'insert' )
	}

	return (
		<>
			<ToolbarButton
				onClick={ openInteractionLibrary }
				onMouseDown={ ev => ev.preventDefault() }
				onKeyDown={ ev => {
					if ( ev.key === 'Enter' || ev.key === ' ' ) {
						openInteractionLibrary()
						ev.preventDefault()
					}
				} }
				className="ugb-insert-library-button"
				icon={ <IconSVG width="20" height="20" /> }
			>
				{ __( 'Interactions', 'interactions' ) }
			</ToolbarButton>
		</>
	)
}

export default AddInteractionButton
