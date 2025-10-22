import IconSVG from './assets/icon.svg'
import ElementSVG from './assets/element.svg'
import PageSVG from './assets/page.svg'
import {
	AddInteractionButton,
	InteractionButton,
	InteractionPanel,
	ImportExportModal,
	GuidedModalTour,
} from './components'
import { createNewInteraction, createNewAction } from './util'
import { useInteractions } from './hooks'
import { interactions as interactionsConfig, manageInteractionsUrl } from 'interactions'
import { InteractionLibrary } from './interaction-library'

import { registerPlugin } from '@wordpress/plugins'
import { __ } from '@wordpress/i18n'
import { upload } from '@wordpress/icons'
import {
	PanelBody,
	Button,
	BaseControl,
	Notice,
} from '@wordpress/components'
import {
	useState,
	useCallback,
	useRef,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element'
import { useSelect, useDispatch } from '@wordpress/data'

import './plugins'
import useOnPostPreview from './use-on-post-save'

const InteractionsEditor = () => {
	// We need to to this for both, because one might be disabled. E.g. in
	// WooCommerce, editSite is loaded and stops the sidebar from showing up.
	const SideEditorPluginSidebar = window.wp.editSite?.PluginSidebar
	const PostEditorPluginSidebar = window.wp.editPost?.PluginSidebar

	const SideBar = SideEditorPluginSidebar ? SideEditorPluginSidebar
		: PostEditorPluginSidebar ? PostEditorPluginSidebar : null

	const selectedBlockAnchor = useSelect( select => {
		const clientId = select( 'core/block-editor' ).getSelectedBlockClientId()
		return clientId ? select( 'core/block-editor' ).getBlockAttributes( clientId )?.anchor : null
	} )

	const interactionLibraryMode = useSelect( select =>
		select( 'interact/interaction-library-modal' ).getMode(),
	[] )
	// Interaction library open modal and set target function
	const {
		setMode: setInteractionLibraryMode,
	} = useDispatch( 'interact/interaction-library-modal' )

	const [ selectedInteraction, setSelectedInteraction ] = useState( null )
	const [ editPropsPassed, setEditPropsPassed ] = useState( {} )
	const [ editMode, setEditMode ] = useState( 'edit' )
	const [ isShowingError, setIsShowingError ] = useState( true )
	const [ importExportModalProps, setImportExportModalProps ] = useState( null )

	const sidebarRef = useRef()
	const isDirtyRef = useRef( false ) // This gets updated when the current interaction being edited is dirty.

	const {
		interactions: allInteractions,
		interactionsFiltered: interactions,
		loadingError,
		updateInteraction,
		deleteInteraction,
	} = useInteractions()

	// This listens to the post preview button and publish button and asks the
	// user to save the interaction if it's dirty.
	const onPostSaveCallback = proceedSaveCallback => {
		if ( isDirtyRef.current ) {
			// eslint-disable-next-line no-alert
			if ( confirm( __( 'You have unsaved changes in your interaction. Do you want to save it before continuing?', 'interactions' ) ) ) {
				// Save the interaction, give the callback as the detail.
				window?.dispatchEvent( new CustomEvent( 'interact/save-interaction', {
					detail: {
						// This callback will be called after the interaction is saved.
						callback: proceedSaveCallback,
					},
				} ) )
				// Return true to stop the preview.
				return true
			}
		}
	}
	useOnPostPreview( onPostSaveCallback )

	const getInteractionFromKey = useCallback( key => {
		return allInteractions.find( interaction => interaction.key === key )
	}, [ allInteractions ] )

	const onAddInteractionHandler = useCallback( ( interactionType, target = null, props = {} ) => {
		if ( selectedInteraction && isDirtyRef.current ) {
			alert( __( 'You are currently editing an interaction, please save or discard your changes first.', 'interactions' ) )// eslint-disable-line no-alert
			return
		}
		setEditMode( 'new' )
		const newInteraction = createNewInteraction( interactionType, target, props )
		setSelectedInteraction( newInteraction )
	}, [ selectedInteraction ] )

	const onEditInteractionHandler = useCallback( ( keyOrInteraction, editProps ) => {
		if ( selectedInteraction && isDirtyRef.current ) {
			alert( __( 'You are currently editing an interaction, please save or discard your changes first.', 'interactions' ) )// eslint-disable-line no-alert
			return
		}
		// If editMode is provided (e.g. when duplicating), set the editMode state accordingly
		if ( typeof editProps.editMode !== 'undefined' ) {
			setEditMode( editProps.editMode )
		}
		setEditPropsPassed( editProps )
		setSelectedInteraction( typeof keyOrInteraction === 'string' ? getInteractionFromKey( keyOrInteraction ) : keyOrInteraction )
	}, [ getInteractionFromKey, selectedInteraction ] )

	// Listen to external adds of interactions from the main toolbar button.
	useEffect( () => {
		const onAddInteractionEventHandler = event => {
			onAddInteractionHandler( event.detail.type, event.detail.target, event.detail.props )
		}
		const onEditInteractionEventHandler = event => {
			const {
				key, interaction, ...editProps
			} = event.detail
			onEditInteractionHandler( key || interaction, editProps )
		}

		window?.addEventListener( 'interact/add-interaction', onAddInteractionEventHandler )
		window?.addEventListener( 'interact/edit-interaction', onEditInteractionEventHandler )

		return () => {
			window?.removeEventListener( 'interact/add-interaction', onAddInteractionEventHandler )
			window?.removeEventListener( 'interact/edit-interaction', onEditInteractionEventHandler )
		}
	}, [ onAddInteractionHandler, onEditInteractionHandler ] )

	useEffect( () => {
		if ( ! selectedInteraction ) {
			setEditPropsPassed( {} )
		}
	}, [ selectedInteraction ] )

	useEffect( () => {
		const dismissedErrors = JSON.parse( localStorage.getItem( 'interact-dismissed-errors' ) || '[]' )
		const errorKey = loadingError?.interactionKey

		if ( ! loadingError?.interactionKey ) {
			return
		}

		if ( dismissedErrors.includes( errorKey ) ) {
			setIsShowingError( false )
		} else {
			setIsShowingError( true )
		}
	}, [ loadingError ] )

	// Interaction library can only be opened if the current interaction is not dirty.
	useEffect( () => {
		if ( selectedInteraction && isDirtyRef.current && interactionLibraryMode ) {
			setInteractionLibraryMode( null )
			alert( __( 'You are currently editing an interaction, please save or discard your changes first.', 'interactions' ) )// eslint-disable-line no-alert
		}
	}, [ selectedInteraction, isDirtyRef, interactionLibraryMode, setInteractionLibraryMode ] )

	const { elementInteractions, pageInteractions } = interactions
		// Sort alphabetically by title
		// .sort( ( a, b ) => {
		// 	if ( a.title < b.title ) {
		// 		return -1
		// 	}
		// 	if ( a.title > b.title ) {
		// 		return 1
		// 	}
		// 	return 0
		// } )
		.reduce( ( acc, interaction ) => {
			const interactionConfig = interactionsConfig[ interaction.type ]
			if ( interactionConfig?.type === 'element' ) {
				acc.elementInteractions.push( interaction )
			} else if ( interactionConfig?.type === 'page' ) {
				acc.pageInteractions.push( interaction )
			}
			return acc
		}, { elementInteractions: [], pageInteractions: [] } )

	const onOpenImportExportModal = props => {
		setImportExportModalProps( props )
	}

	const onCloseImportExportModal = () => {
		setImportExportModalProps( null )
	}

	// If the sidebar is not available (like in the Widgets editor), then do nothing.
	if ( ! SideBar ) {
		return null
	}

	return <>
		<SideBar
			name="sidebar"
			title={ __( 'Interactions', 'interactions' ) }
			className="interact-sidebar"
			icon={ <IconSVG width="20" height="20" /> }
		>
			{ selectedInteraction === null && loadingError && isShowingError &&
				<PanelBody>
					<Notice
						status="error"
						onDismiss={ () => setIsShowingError( false ) }
						isDismissible={ false }
					>
						<p>{ loadingError.message }</p>
						<p>{ __( 'Check the browser console for more details.', 'interactions' ) }</p>
						<div className="interact-dismiss-button-container">
							<Button
								className="interact-dismiss-button"
								variant="secondary"
								size="small"
								onClick={ () => {
									const dismissedErrors = JSON.parse( localStorage.getItem( 'interact-dismissed-errors' ) || '[]' )
									const errorKey = loadingError?.interactionKey
									localStorage.setItem( 'interact-dismissed-errors', JSON.stringify( [ ...dismissedErrors, errorKey ] ) )
									setIsShowingError( false )
								} }
							>
								{ __( 'Dismiss', 'interactions' ) }
							</Button>
						</div>
					</Notice>
				</PanelBody>
			}
			{ allInteractions.length > 0 && selectedInteraction === null &&
				<PanelBody>
					{ interactions.length > 0 && <p className="interact-editor-footer">{ __( 'These interactions are on this page because of their location rules.', 'interactions' ) }</p> }
					{ interactions.length === 0 && <p className="interact-editor-footer">{ __( 'There are no interactions on this page because no matches were found in the location rules.', 'interactions' ) }</p> }
					<Button
						variant="tertiary"
						size="small"
						href={ manageInteractionsUrl }
						target="_manage"
					>
						{ __( 'Manage all your interactions', 'interactions' ) }
					</Button>
				</PanelBody>
			}
			{ selectedInteraction === null &&
				<div ref={ sidebarRef }>
					<PanelBody
						title={ __( 'Element Triggered', 'interactions' ) }
					>
						<p className="interact-panel-description">
							{ __( 'Animate or trigger actions on any button, image, text or widget.', 'interactions' ) }
							&nbsp;
							<a href="https://docs.wpinteractions.com/article/571-what-are-interactions" target="_docs" rel="noopener noreferrer">
								{ __( 'Learn more', 'interactions' ) }
							</a>
						</p>
						<BaseControl
							className="interact-list-control"
							label={ __( 'Element Interactions', 'interactions' ) }
						>
							<div className="interact-panel-side-buttons">
								<Button
									icon={ upload }
									label={ __( 'Import interaction', 'interactions' ) }
									onClick={ () => onOpenImportExportModal( {
										title: __( 'Import Interaction', 'interactions' ),
										description: ( <>
											<p>{ __( 'To import, paste a valid interaction JSON into the field and click “Import interaction" to load a new interaction.', 'interactions' ) }</p>
											<p>{ createInterpolateElement(
												__( 'Need help? <a>Visit our documentation</a> to see examples of interactions you can import.', 'interactions' ),
												// eslint-disable-next-line jsx-a11y/anchor-has-content
												{ a: <a href="https://docs.wpinteractions.com/collection/656-interaction-examples" target="_blank" rel="noopener noreferrer" /> }
											) }</p>
										</> ),
										importLabel: __( 'Import interaction', 'interactions' ),
										onImport: onAddInteractionHandler,
									} ) }
								/>
								<AddInteractionButton
									type="element"
									onAddInteraction={ onAddInteractionHandler }
								/>
							</div>
							<div>
								{ elementInteractions
									.map( interaction => {
										return (
											<InteractionButton
												key={ interaction.key }
												highlightEnabled
												interaction={ interaction }
												isHighlighted={ interaction.target.type === 'block' && selectedBlockAnchor === interaction.target.value }
												onClick={ () => {
													setSelectedInteraction( interaction )
												} }
												onDelete={ () => {
													deleteInteraction( interaction.key )
												} }
											/>
										)
									} ) }
								{ ! elementInteractions.length && (
									<div className="interact-list-control__empty-description">
										<ElementSVG width="32" height="32" />
										<p>{ __( 'Define actions that occur when user interacts with elements on your page', 'interactions' ) }</p>
									</div>
								) }
							</div>
						</BaseControl>

					</PanelBody>
					<PanelBody title={ __( 'Page Triggered', 'interactions' ) }>
						<p className="interact-panel-description">
							{ __( 'Launch page‑wide transitions, backgrounds or state‑based effects.', 'interactions' ) }
							&nbsp;
							<a href="https://docs.wpinteractions.com/article/571-what-are-interactions" target="_docs" rel="noopener noreferrer">
								{ __( 'Learn more', 'interactions' ) }
							</a>
						</p>
						<BaseControl
							className="interact-list-control"
							label={ __( 'Page Interactions', 'interactions' ) }
						>
							<div className="interact-panel-side-buttons">
								<Button
									icon={ upload }
									label={ __( 'Import interaction', 'interactions' ) }
									onClick={ () => onOpenImportExportModal( {
										title: __( 'Import Interaction', 'interactions' ),
										description: ( <>
											<p>{ __( 'To import, paste a valid interaction JSON into the field and click “Import Interaction" to load a new interaction.', 'interactions' ) }</p>
											<p>{ createInterpolateElement(
												__( 'Need help? <a>Visit our documentation</a> to see examples of interactions you can import.', 'interactions' ),
												// eslint-disable-next-line jsx-a11y/anchor-has-content
												{ a: <a href="https://docs.wpinteractions.com/collection/656-interaction-examples" target="_blank" rel="noopener noreferrer" /> }
											) }</p>
										</> ),
										importLabel: __( 'Import interaction', 'interactions' ),
										onImport: ( type, target, data ) => {
											// Create new actions based on import to regenerate action key
											// and fill missing properties with defaults.
											const timelines = data.timelines || []
											timelines.forEach( ( timeline, i ) => {
												const actionsToImport = timeline.actions || []
												const newActions = actionsToImport.map( action => (
													createNewAction( {
														actionType: action.type ?? '',
														start: action.timing?.start ?? 0,
														targetType: action.target?.type ?? '',
														props: { ...action },
													} )
												) )
												data.timelines[ i ] = { ...timeline, actions: newActions }
											} )

											onAddInteractionHandler( type, target, data )
										},
									} ) }
								/>
								<AddInteractionButton
									type="page"
									onAddInteraction={ onAddInteractionHandler }
								/>
							</div>
							<div>
								{ pageInteractions
									.map( interaction => {
										return (
											<InteractionButton
												key={ interaction.key }
												highlightEnabled
												interaction={ interaction }
												isHighlighted={ interaction.target.type === 'block' && selectedBlockAnchor === interaction.target.value }
												onClick={ () => {
													setSelectedInteraction( interaction )
												} }
												onDelete={ () => {
													deleteInteraction( interaction.key )
												} }
											/>
										)
									} ) }
								{ ! pageInteractions.length && (
									<div className="interact-list-control__empty-description">
										<PageSVG width="32" height="32" />
										<p>{ __( 'Define actions that occur when there\'s a change in your page\'s state', 'interactions' ) }</p>
									</div>
								) }
							</div>
						</BaseControl>
					</PanelBody>
					{ /* <PanelBody>
							<Button
								variant="secondary"
								onClick={ () => onOpenImportExportModal( {
									title: __( 'Import Interaction', 'interactions' ),
									description: __( 'Paste the code of the interaction you want to import' ),
									importLabel: __( 'Import interaction', 'interactions' ),
									onImport: () => {},
								} ) }
							>
								Import Interaction
							</Button>
						</PanelBody> */ }
				</div>
			}
			{ selectedInteraction !== null &&
				<InteractionPanel
					{ ...editPropsPassed }
					editMode={ editMode }
					interaction={ selectedInteraction }
					onChange={ newInteraction => {
						return updateInteraction( newInteraction ).then( () => {
							setEditMode( 'edit' )
						} )
					} }
					onClose={ ( focusOnInteractionButton = false ) => {
						if ( focusOnInteractionButton ) {
							// Focus on the previous interaction button so we can go back to it.
							setTimeout( () => {
								sidebarRef.current?.querySelector( `.interact-list__item-button--${ selectedInteraction.key }` )?.focus()
							} )
						}
						setSelectedInteraction( null )
						setEditMode( 'edit' )
					} }
					onDelete={ () => deleteInteraction( selectedInteraction.key ) }
					onDirtyChange={ isDirty => isDirtyRef.current = isDirty }
					onOpenImportExportModal={ onOpenImportExportModal }
				/>
			}
			{ importExportModalProps &&
				<ImportExportModal { ...importExportModalProps } onClose={ onCloseImportExportModal } />
			}
		</SideBar>
		{ /* Render the Interaction Library modal in the root editor component */
			interactionLibraryMode && <InteractionLibrary />
		}
		<GuidedModalTour tourId="editor" />
	</>
}

registerPlugin( 'interact-editor', {
	render: InteractionsEditor,
} )
