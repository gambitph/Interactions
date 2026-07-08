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
		description = __( 'Please select a block in the editor area to add this interaction to.', 'interactions' ),
		primaryLabel = __( 'Select Block', 'interactions' ),
		primaryDisabled = null,
		enableBlockSelectMode = true,
	} = props

	const {
		selectedClientId, blockName,
	} = useSelect( select => {
		if ( ! enableBlockSelectMode ) {
			return {
				selectedClientId: null,
				blockName: '',
			}
		}

		const blockSelectStore = select( 'interact/block-select' )
		const blockEditorStore = select( 'core/block-editor' )
		if ( ! blockSelectStore?.getSelectedClientId || ! blockEditorStore?.getBlock ) {
			return {
				selectedClientId: null,
				blockName: '',
			}
		}

		const clientId = blockSelectStore.getSelectedClientId()
		const block = blockEditorStore.getBlock( clientId )
		const blockName = block?.name || ''
		return {
			selectedClientId: clientId,
			blockName,
		}
	}, [ enableBlockSelectMode ] )

	const isPrimaryDisabled = primaryDisabled ?? ! selectedClientId

	useEffect( () => {
		if ( ! enableBlockSelectMode ) {
			return NOOP
		}

		dispatch( 'interact/block-select' ).setSelectMode( true )
		return () => {
			dispatch( 'interact/block-select' ).setSelectMode( false )
			dispatch( 'interact/block-select' ).setSelectedClientId( null )
		}
	}, [ enableBlockSelectMode ] )

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
					<p>{ description }</p>
					<Button
						variant="primary"
						onClick={ () => {
							// TODO: before we select the block, we need to
							// check if the anchor is unique. If not, then alert
							// the user that this anchor is already in use and
							// then ask if he wants to overwrite it.
							onBlockSelect( selectedClientId, blockName )
						} }
						disabled={ isPrimaryDisabled }
					>
						{ primaryLabel }
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
