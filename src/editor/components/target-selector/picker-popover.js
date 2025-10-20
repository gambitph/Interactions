import { FlexLayout } from '../'
import classNames from 'classnames'
import {
	Button, PanelBody, Popover,
} from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { useEffect } from '@wordpress/element'
import { useSelect, dispatch } from '@wordpress/data'

const NOOP = () => {}

const BlockPickerPopover = props => {
	const {
		placement = 'left-start',
		offset = 24,
		onClose = NOOP,
		onBlockSelect = NOOP,
		isSmall = false,
		anchor = null,
		noArrow = false,
	} = props

	const {
		selectedClientId, blockName,
	} = useSelect( select => {
		const clientId = select( 'interact/block-select' ).getSelectedClientId()
		const block = select( 'core/block-editor' ).getBlock( clientId )
		const blockName = block?.name || ''
		return {
			selectedClientId: clientId,
			blockName,
		}
	} )

	useEffect( () => {
		dispatch( 'interact/block-select' ).setSelectMode( true )
		return () => {
			dispatch( 'interact/block-select' ).setSelectMode( false )
			dispatch( 'interact/block-select' ).setSelectedClientId( null )
		}
	}, [] )

	return (
		<Popover
			className="interact-popover interact-popover-block-picker"
			placement={ placement }
			offset={ offset }
			noArrow={ noArrow }
			anchor={ anchor }
		>
			<PanelBody>
				<FlexLayout className={ classNames( { 'interact-picker--small': isSmall } ) } justifyContent="flex-end">
					<p>{ __( 'Please select a block in the editor area to add this interaction to.', 'interactions' ) }</p>
					<Button
						variant="primary"
						onClick={ () => {
							// TODO: before we select the block, we need to
							// check if the anchor is unique. If not, then alert
							// the user that this anchor is already in use and
							// then ask if he wants to overwrite it.
							onBlockSelect( selectedClientId, blockName )
						} }
						disabled={ ! selectedClientId }
					>
						{ __( 'Select Block', 'interactions' ) }
					</Button>
					<Button
						variant="secondary"
						onClick={ onClose }
						onKeyDown={ ev => {
							if ( ev.key === 'Escape' ) {
								onClose()
							}
						} }
					>
						{ __( 'Cancel', 'interactions' ) }
					</Button>
				</FlexLayout>
			</PanelBody>
		</Popover>
	)
}

export default BlockPickerPopover
