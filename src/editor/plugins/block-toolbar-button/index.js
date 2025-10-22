/**
 * Adds the "Add interaction" button in the block toolbar
 */
import IconSVG from '~interact/editor/assets/icon.svg'
import { AddInteractionPopover, InteractionButton } from '~interact/editor/components'
import { getOrGenerateBlockAnchor, openInteractionsSidebar } from '~interact/editor/util'
import { useInteractions, useWithShift } from '~interact/editor/hooks'

import { BlockControls } from '@wordpress/block-editor'
import {
	BaseControl,
	Button,
	Dashicon,
	PanelBody,
	Popover,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { createHigherOrderComponent } from '@wordpress/compose'
import { addFilter } from '@wordpress/hooks'
import { useEffect, useState } from '@wordpress/element'
import {
	dispatch, useSelect, useDispatch,
} from '@wordpress/data'
import useBlockHasInteraction from './use-block-has-interaction'

const withBlockToolbarButton = createHigherOrderComponent( BlockEdit => {
	return props => {
		const [ isPopoverOpen, setIsPopoverOpen ] = useState( false )

		const hasAnchorAttribute = useSelect( select => {
			return !! select( 'core/blocks' ).getBlockType( props.name )?.attributes?.anchor
		}, [ props.name ] )

		const { interactions, deleteInteraction } = useInteractions()
		const interactionKeys = useBlockHasInteraction( props.attributes.anchor )
		const defaultPopoverMode = ! interactionKeys.length ? 'add' : 'select'
		const [ popoverMode, setPopoverMode ] = useState( defaultPopoverMode )
		const isShiftKey = useWithShift()

		// Interaction library open modal and set target function
		const {
			setMode: setInteractionLibraryMode,
			setTarget: setInteractionLibraryTarget,
		} = useDispatch( 'interact/interaction-library-modal' )

		// Update the default popover mode when the anchor changes.
		useEffect( () => {
			setPopoverMode( ! interactionKeys.length ? 'add' : 'select' )
		}, [ props.attributes.anchor, interactionKeys.length ] )

		// Reeset the popover mode when the popover closes.
		useEffect( () => {
			if ( ! isPopoverOpen ) {
				setPopoverMode( defaultPopoverMode )
			}
		}, [ isPopoverOpen, defaultPopoverMode ] )

		// If the popover is open and you select another block, this should close.
		useEffect( () => {
			if ( ! props.isSelected ) {
				setIsPopoverOpen( false )
			}
		}, [ props.isSelected ] )

		// If the popover is opened and popoverMode is 'add', the interaction library
		// should be opened.
		useEffect( () => {
			if ( isPopoverOpen && popoverMode === 'add' ) {
				const anchor = getOrGenerateBlockAnchor( props.clientId )
				const target = {
					type: 'block',
					value: anchor,
					blockName: props.name,
				}
				setIsPopoverOpen( false )
				setInteractionLibraryTarget( target )
				setInteractionLibraryMode( 'apply' )
			}
		}, [ isPopoverOpen, popoverMode, props.clientId, props.name, setInteractionLibraryTarget, setInteractionLibraryMode ] )

		// If the Sidebar isn't available, then do not render the toolbar button
		// because we will have no place to edit interactions.
		if ( ! dispatch( 'core/edit-post' ) && ! dispatch( 'core/edit-site' ) ) {
			return <BlockEdit { ...props } />
		}

		// Only blocks that have an anchor attribute can have interactions.
		// because we need the ID of the block to be able to target it.
		if ( ! hasAnchorAttribute ) {
			return <BlockEdit { ...props } />
		}

		const onAddInteractionHandler = interactionType => {
			// Open the sidebar
			openInteractionsSidebar()

			const anchor = getOrGenerateBlockAnchor( props.clientId )

			// Trigger the sidebar to create a new interaction and edit it.
			window.dispatchEvent( new window.CustomEvent( 'interact/add-interaction', {
				detail: {
					type: interactionType,
					target: {
						type: 'block',
						value: anchor,
						blockName: props.name,
					},
				},
			} ) )
		}

		const deleteAllInteractions = () => {
			window.dispatchEvent( new window.CustomEvent( 'interact/close-interaction' ) )
			interactionKeys.forEach( key => {
				deleteInteraction( key )
			} )
		}

		const label = interactionKeys.length === 0 ? __( 'Interaction Library', 'interactions' )
			: __( 'Add or view interactions', 'interactions' )

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							className="interact-block-toolbar-button"
							icon={ <IconSVG width="20" height="20" /> }
							title={ label }
							onClick={ () => setIsPopoverOpen( value => ! value ) }
							onMouseDown={ ev => ev.preventDefault() }
							onKeyDown={ ev => {
								if ( ev.key === 'Enter' || ev.key === ' ' ) {
									setIsPopoverOpen( value => ! value )
									ev.preventDefault()
								}
							} }
							isActive={ !! interactionKeys.length }
						/>
						{ isPopoverOpen && popoverMode === 'add' && (
							<AddInteractionPopover
								title={ __( 'Add Element Interaction for this Block', 'interactions' ) }
								showElementPicker={ false }
								showPageOption={ false }
								showLibraryOption={ false }
								onAddInteraction={ onAddInteractionHandler }
								onClose={ () => setIsPopoverOpen( false ) }
							/>
						) }
						{ isPopoverOpen && popoverMode === 'select' && (
							<Popover
								className="interact-block-toolbar-button__select-popover"
								offset={ 13 }
								flip={ true }
								variant="toolbar"
							>
								<PanelBody>
									<Button
										className="interact-block-toolbar-button__select-popover__add-button"
										variant="secondary"
										onClick={ () => setPopoverMode( 'add' ) }
										iconPosition="right"
									>
										{ __( 'Interaction Library', 'interactions' ) }
										&nbsp;
										<Dashicon icon="arrow-right-alt2" />
									</Button>
									<div style={ { marginTop: '24px' } } />
									<BaseControl
										label={ __( 'Edit current interactions', 'interactions' ) }
									>
										{ interactionKeys.map( interactionKey => {
											return (
												<InteractionButton
													key={ interactionKey }
													interaction={ interactions.find( interaction => interaction.key === interactionKey ) }
													onClick={ () => {
														// Open the sidebar
														openInteractionsSidebar()

														window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
															detail: { key: interactionKey },
														} ) )
														setIsPopoverOpen( false )
													} }
													onDelete={ () => {
														// If this was the last interaction, close the popover.
														if ( interactionKeys.length === 1 ) {
															setIsPopoverOpen( false )
														}
														// Close the interaction being edited.
														window.dispatchEvent( new window.CustomEvent( 'interact/close-interaction' ) )
														deleteInteraction( interactionKey )
													} }
												/>
											)
										} ) }
									</BaseControl>
									{ interactionKeys.length >= 2 &&
										<div className="interact-block-toolbar-button__select-popover__delete-all__wrapper">
											<Button
												variant="tertiary"
												size="small"
												label={ __( 'Delete all interactions attached to the block', 'interactions' ) }
												showTooltip={ true }
												onClick={ () => {
													if ( isShiftKey || confirm( __( 'Are you sure you want to delete this interaction? To delete without prompting, hold down the shift key when deleting.', 'interactions' ) ) ) { // eslint-disable-line no-alert
														deleteAllInteractions()

														setIsPopoverOpen( false )
													}
												} }
											>
												{ __( 'Delete all interactions', 'interactions' ) }
											</Button>
										</div>
									}
								</PanelBody>
							</Popover>
						) }
					</ToolbarGroup>
				</BlockControls>
			</>
		)
	}
}, 'withBlockToolbarButton' )

addFilter(
	'editor.BlockEdit',
	'interact/block-toolbar-button',
	withBlockToolbarButton
)
