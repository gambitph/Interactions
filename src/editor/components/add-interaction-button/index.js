import { Button } from '@wordpress/components'
import { useState } from '@wordpress/element'
import { __ } from '@wordpress/i18n'
import AddInteractionPopover from '../add-interaction-popover'

const NOOP = () => {}

const AddInteractionButton = props => {
	const {
		type = 'element',
		onAddInteraction = NOOP,
	} = props

	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false )

	return (
		<div>
			<Button
				icon="plus-alt2"
				label={ __( 'Add Interaction', 'interactions' ) }
				onClick={ () => setIsPopoverOpen( value => ! value ) }
				onMouseDown={ ev => ev.preventDefault() }
				onKeyDown={ ev => {
					if ( ev.key === 'Enter' || ev.key === ' ' ) {
						setIsPopoverOpen( value => ! value )
						ev.preventDefault()
					}
				} }
			/>
			{ isPopoverOpen && (
				<AddInteractionPopover
					showPageOption={ type === 'page' }
					showElementOption={ type === 'element' }
					initialSelected={ type }
					onAddInteraction={ onAddInteraction }
					onClose={ () => setIsPopoverOpen( false ) }
				/>
			) }
		</div>
	)
}

export default AddInteractionButton
