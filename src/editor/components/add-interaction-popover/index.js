import { FlexLayout, TargetSelector } from '..'
import ElementSVG from '../../assets/element.svg'
import PageSVG from '../../assets/page.svg'
import LibrarySVG from '../../assets/library.svg'
import {
	interactionCategories,
	interactions as interactionsConfig,
	manageInteractionsUrl,
} from 'interactions'
import { useInteractions } from '~interact/editor/hooks'
import {
	getOrGenerateBlockAnchor,
	getOrGenerateBlockClass,
	getLocationForCurrentPage,
	duplicateInteraction,
	setBlockAnchorIfPossible,
	openInteractionsSidebar,
} from '~interact/editor/util'
import { cloneDeep, first } from 'lodash'

import {
	Button,
	Popover,
	PanelBody,
	MenuGroup,
	MenuItem,
	Dashicon,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components'
import { useState } from '@wordpress/element'
import { useSelect, select } from '@wordpress/data'
import { __, sprintf } from '@wordpress/i18n'
import { BlockPickerPopover } from '../target-selector'
import { ProUpsell } from '../pro-crown'

const NOOP = () => {}

const AddInteractionPopover = props => {
	const {
		offset = 13,
		initialSelected = 'element',
		showPickerLabel = false,
		title = __( 'Add Interaction', 'interactions' ),
		showInteractionPicker = true,
		showElementOption = true,
		showPageOption = true,
		showLibraryOption = true,
		showElementPicker = true,
		onAddInteraction = NOOP,
		onClose = NOOP,
	} = props

	const [ selected, setSelected ] = useState( initialSelected )
	const [ showDescription, setShowDescription ] = useState( null )
	const [ hidden, setHidden ] = useState( false )

	const {
		getBlockNamesByClientId,
		getSelectedBlockClientId,
	} = useSelect( select => {
		return {
			getBlockNamesByClientId: select( 'core/block-editor' ).getBlockNamesByClientId,
			getSelectedBlockClientId: select( 'core/block-editor' ).getSelectedBlockClientId,
		}
	} )

	const [ target, setTarget ] = useState( {
		type: 'block',
		value: getOrGenerateBlockAnchor( getSelectedBlockClientId(), false ) || '',
		blockName: first( getBlockNamesByClientId( getSelectedBlockClientId() ) ) || '',
	} )

	const libraryTitle = ! showElementOption && showPageOption ? __( 'My Page Interactions', 'interactions' )
		: showElementOption && ! showPageOption ? __( 'My Element Interactions', 'interactions' )
			: __( 'My Interactions', 'interactions' )

	const {
		interactions,
		interactionsFiltered,
	} = useInteractions()

	const { elementInteractions, pageInteractions } = interactions.reduce( ( acc, interaction ) => {
		const interactionConfig = interactionsConfig[ interaction.type ]
		if ( interactionConfig ) {
			if ( interactionConfig?.type === 'element' ) {
				acc.elementInteractions.push( interaction )
			} else if ( interactionConfig?.type === 'page' ) {
				acc.pageInteractions.push( interaction )
			}
		}
		return acc
	}, { elementInteractions: [], pageInteractions: [] } )

	if ( hidden ) {
		return (
			<BlockPickerPopover
				offset={ offset }
				flip={ true }
				variant="toolbar"
				onBlockSelect={ ( clientId, blockName ) => {
					const valueArgs = {
						...target,
						blockName,
					}

					let pickerMode = target === 'block' ? 'id' : 'class'
					if ( pickerMode === 'id' ) {
						// If id, use the block id as the anchor. If the
						// block doesn't support anchors is not supported,
						// then use picker mode class.
						const hasAnchorAttribute = !! select( 'core/blocks' ).getBlockType( blockName )?.attributes?.anchor
						if ( hasAnchorAttribute ) {
							valueArgs.value = getOrGenerateBlockAnchor( clientId, true )
						} else {
							pickerMode = 'class'
						}
					}

					if ( pickerMode === 'class' ) {
						// If class, use the first class name if there is one, or create a new one.
						valueArgs.value = getOrGenerateBlockClass( clientId, true )
						valueArgs.type = 'class'
					}

					setTarget( valueArgs )
					setHidden( false )
				} }
				onClose={ () => setHidden( false ) }
			/>
		)
	}

	return (
		<Popover
			className="interact-popover interact-add-interaction-popover"
			offset={ offset }
			onClose={ onClose }
			flip={ true }
			variant="toolbar"
			resize={ false }
			shift={ true }
		>
			<PanelBody>
				<Button
					className="interact-add-interaction-popover__close-button"
					size="small"
					variant="tertiary"
					icon="no-alt"
					label={ __( 'Close Action', 'interactions' ) }
					showTooltip={ false }
					onClick={ onClose }
				/>
				<FlexLayout style={ { marginBottom: '16px' } } justifyContent="start" gridGap="0">
					<h4 style={ { margin: 0 } }>{ title }</h4>
					<Button
						className="interact-list-control__title-tip"
						icon="info-outline"
						iconSize="16"
						size="small"
						variant="tertiary"
						label={ __( 'Learn more', 'interactions' ) }
						onClick={ () => window?.open( 'https://docs.wpinteractions.com/article/571-what-are-interactions', '_docs' ) }
					/>
				</FlexLayout>

				{ showInteractionPicker && (
					<>
						<ToggleGroupControl
							isBlock
							label={ showPickerLabel ? __( 'Pick the type of interaction to create', 'interactions' ) : undefined }
							value={ selected }
							onChange={ setSelected }
						>
							{ showElementOption && (
								<ToggleGroupControlOption
									value="element"
									label={
										<div className="interact-add-interaction__option-label">
											<ElementSVG width="20" height="20" />
											<h4>{ __( 'Element Interaction', 'interactions' ) }</h4>
											<p>{ __( 'Define actions that occur when user interacts with elements on your page', 'interactions' ) }</p>
										</div>
									}
									onMouseEnter={ () => setShowDescription( __( 'Examples of element interactions: fade in element, tilt element to look at the mouse', 'interactions' ) ) }
									onMouseLeave={ () => setShowDescription( null ) }
								/>
							) }
							{ showPageOption && (
								<ToggleGroupControlOption
									value="page"
									label={
										<div className="interact-add-interaction__option-label">
											<PageSVG width="20" height="20" />
											<h4>{ __( 'Page Interaction', 'interactions' ) }</h4>
											<p>{ __( 'Define actions that occur when there\'s a change in your page\'s state', 'interactions' ) }</p>
										</div>
									}
									onMouseEnter={ () => setShowDescription( __( 'Examples of page interactions: display post meta, parallax scroll effect, scroll when url hash changes', 'interactions' ) ) }
									onMouseLeave={ () => setShowDescription( null ) }
								/>
							) }
							{ showLibraryOption && (
								<ToggleGroupControlOption
									value="library"
									label={
										<div className="interact-add-interaction__option-label">
											<LibrarySVG width="20" height="20" />
											<h4>{ libraryTitle }</h4>
											<p>{ __( 'Reuse interactions that you have previously created', 'interactions' ) }</p>
										</div>
									}
									onMouseEnter={ () => setShowDescription( __( 'Duplicate, edit, and reuse interactions that you have previously created', 'interactions' ) ) }
									onMouseLeave={ () => setShowDescription( null ) }
								/>
							) }
						</ToggleGroupControl>

						<div style={ { marginTop: '24px' } } />
					</>
				) }

				{ showElementPicker && selected === 'element' && (
					<TargetSelector
						value={ target }
						onChange={ setTarget }
						hasPickerPopover={ false }
						onBlockSelectClick={ () => setHidden( true ) }
					/>
				) }

				<div style={ { marginTop: '24px' } } />

				{ ( selected === 'element' || selected === 'page' ) && (
					<>
						<h4>{ __( 'Pick an Interaction', 'interactions' ) }</h4>
						<div className="interact-add-interaction-popover__interaction-list interact-interaction-list">
							{ interactionCategories[ selected ].map( category => {
								return (
									<MenuGroup key={ category.name } label={ category.name }>
										{ category.interactions.map( interactionName => {
											const interaction = interactionsConfig[ interactionName ]
											return (
												<MenuItem
													key={ interactionName }
													onClick={ () => {
														if ( target.type === 'block' ) {
															setBlockAnchorIfPossible( target.value )
														}
														onAddInteraction( interactionName, target )
														onClose()
													} }
													onMouseEnter={ () => setShowDescription( interactionName ) }
													onMouseLeave={ () => setShowDescription( null ) }
												>
													{ interaction?.name || interactionName }
												</MenuItem>
											)
										} ) }
									</MenuGroup>
								)
							} ) }
						</div>
					</>
				) }

				{ selected === 'library' && (
					<>
						{ ( showElementOption && !! elementInteractions.length ) && (
							<>
								<h4 className="components-menu-group__label">{ __( 'Your Element Interactions', 'interactions' ) }</h4>
								<div className="interact-add-interaction-popover__interaction-list interact-add-interaction-popover__interaction-list-2">
									{ elementInteractions
										.map( interaction => {
											const isInPost = !! interactionsFiltered.find( i => i.key === interaction.key )

											// TODO: disable add button if it already has a location rule for this post. Also change the help text to say so.
											return (
												<FlexLayout
													className="interact-popover-interaction-item components-button components-menu-item__button"
													alignItems="center"
													key={ interaction.key }
												>
													<span
														onMouseEnter={ () =>
															setShowDescription( ! isInPost ? __( 'Add this interaction to this post or duplicate this interaction', 'interactions' )
																: __( 'This interaction is already in this post, edit or duplicate this interaction', 'interactions' ) )
														}
														onMouseLeave={ () => setShowDescription( null ) }
													>
														{ interaction.title }
													</span>
													<Button
														label={ __( 'Add interaction to this post', 'interactions' ) }
														icon="plus-alt2"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'A new Location Rule will be added to this interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														disabled={ isInPost }
														onClick={ () => {
															// Add our new location.
															const newInteraction = cloneDeep( interaction )
															const newLocation = getLocationForCurrentPage()
															newInteraction.locations.push( [ newLocation ] )

															// Open the sidebar
															openInteractionsSidebar()

															// Trigger an edit on this interaction.
															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: {
																	interaction: newInteraction,
																	initialDirty: true,
																},
															} ) )

															onClose()
														} }
													/>
													<Button
														label={ __( 'Edit interaction', 'interactions' ) }
														icon="edit"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'Edit this interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														onClick={ () => {
															// Open the sidebar
															openInteractionsSidebar()

															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: { key: interaction.key },
															} ) )

															onClose()
														} }
													/>
													<Button
														label={ __( 'Duplicate interaction', 'interactions' ) }
														icon="admin-page"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'This interaction will be duplicated into a new interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														onClick={ () => {
															// Duplicate the interaction.
															const newLocation = getLocationForCurrentPage()
															const newInteraction = duplicateInteraction( interaction, {
																active: true,
																locations: [ [ newLocation ] ],
															} )

															// Open the sidebar
															openInteractionsSidebar()

															// Trigger an edit on this interaction.
															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: {
																	interaction: newInteraction,
																	editMode: 'new',
																},
															} ) )

															onClose()
														} }
													/>
												</FlexLayout>
											)
										} ) }
								</div>
							</>
						) }
						{ ( showElementOption && showPageOption && !! elementInteractions.length ) && (
							<div style={ { marginTop: '24px' } } />
						) }
						{ ( showPageOption && !! pageInteractions.length ) && (
							<>
								<h4 className="components-menu-group__label">{ __( 'Your Page Interactions', 'interactions' ) }</h4>
								<div className="interact-add-interaction-popover__interaction-list interact-add-interaction-popover__interaction-list-2">
									{ pageInteractions
										.map( interaction => {
											const isInPost = !! interactionsFiltered.find( i => i.key === interaction.key )

											// TODO: disable add button if it already has a location rule for this post. Also change the help text to say so.
											return (
												<FlexLayout
													className="interact-popover-interaction-item components-button components-menu-item__button"
													alignItems="center"
													key={ interaction.key }
												>
													<span
														onMouseEnter={ () =>
															setShowDescription( ! isInPost ? __( 'Add this interaction to this post or duplicate this interaction', 'interactions' )
																: __( 'This interaction is already in this post, edit or duplicate this interaction', 'interactions' ) )
														}
														onMouseLeave={ () => setShowDescription( null ) }
													>
														{ interaction.title }
													</span>
													<Button
														label={ __( 'Add interaction to this post', 'interactions' ) }
														icon="plus-alt2"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'A new Location Rule will be added to this interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														disabled={ isInPost }
														onClick={ () => {
															// Add our new location.
															const newInteraction = cloneDeep( interaction )
															const newLocation = getLocationForCurrentPage()
															newInteraction.locations.push( [ newLocation ] )

															// Open the sidebar
															openInteractionsSidebar()

															// Trigger an edit on this interaction.
															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: {
																	interaction: newInteraction,
																	initialDirty: true,
																},
															} ) )

															onClose()
														} }
													/>
													<Button
														label={ __( 'Edit interaction', 'interactions' ) }
														icon="edit"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'Edit this interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														onClick={ () => {
															// Open the sidebar
															openInteractionsSidebar()

															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: { key: interaction.key },
															} ) )

															onClose()
														} }
													/>
													<Button
														label={ __( 'Duplicate interaction', 'interactions' ) }
														icon="admin-page"
														variant="secondary"
														size="small"
														iconSize={ 16 }
														onMouseEnter={ () => setShowDescription( __( 'This interaction will be duplicated into a new interaction', 'interactions' ) ) }
														onMouseLeave={ () => setShowDescription( null ) }
														onClick={ () => {
															// Duplicate the interaction.
															const newLocation = getLocationForCurrentPage()
															const newInteraction = duplicateInteraction( interaction, {
																active: true,
																locations: [ [ newLocation ] ],
															} )

															// Open the sidebar
															openInteractionsSidebar()

															// Trigger an edit on this interaction.
															window.dispatchEvent( new window.CustomEvent( 'interact/edit-interaction', {
																detail: {
																	interaction: newInteraction,
																	editMode: 'new',
																},
															} ) )

															onClose()
														} }
													/>
												</FlexLayout>
											)
										} ) }
								</div>
							</>
						) }
						{ ( showElementOption && showPageOption && ! interactions.length ) && (
							<p className="interact-add-interaction-popover__empty-note">{ __( 'You don\'t have any interactions yet', 'interactions' ) }</p>
						) }
						{ ( showElementOption && ! showPageOption && ! elementInteractions.length ) && (
							<p className="interact-add-interaction-popover__empty-note">{ __( 'You don\'t have any element interactions yet', 'interactions' ) }</p>
						) }
						{ ( ! showElementOption && showPageOption && ! pageInteractions.length ) && (
							<p className="interact-add-interaction-popover__empty-note">{ __( 'You don\'t have any page interactions yet', 'interactions' ) }</p>
						) }
						{ ( ( showElementOption || showPageOption ) && interactions.length ) && (
							<Button
								variant="secondary"
								href={ manageInteractionsUrl }
								target="_manage"
								style={ {
									marginTop: '16px', width: '100%', justifyContent: 'center',
								} }
							>
								{ __( 'Manage all your interactions', 'interactions' ) }
							</Button>
						) }
					</>
				) }

				<>
					<div style={ { marginTop: '16px' } } />
					<FlexLayout
						className="interact-popover-help"
						justifyContent="start"
					>
						<Dashicon icon="info-outline" /> { showDescription ? ( interactionsConfig[ showDescription ]?.description || showDescription ) : __( 'Hover over an interaction to show a description of what it is', 'interactions' ) }
					</FlexLayout>
				</>

				{ BUILD_TYPE === 'free' && <>
					<div style={ { marginTop: '16px' } } />
					<ProUpsell
						title={ sprintf( __( 'Unlock %s+ Premium Interactions', 'interactions' ), PREMIUM_INTERACTIONS_NUM ) }
						description={ __( 'Page exit intent, scroll strength, LocalStorage change and more', 'interactions' ) }
					/>
				</> }
			</PanelBody>
		</Popover>
	)
}

export default AddInteractionPopover
