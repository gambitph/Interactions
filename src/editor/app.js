import ElementSVG from './assets/element.svg'
import PageSVG from './assets/page.svg'
import LibrarySVG from './assets/library.svg'
import {
	AddInteractionButton,
	InteractionButton,
	InteractionPanel,
	ImportExportModal,
} from './components'
import { createNewInteraction, createNewAction } from './util'
import { useInteractions } from './hooks'
import {
	getCurrentSelectedTarget,
	isBuilderEditor,
} from './editors'
import { interactions as interactionsConfig, manageInteractionsUrl } from 'interactions'

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

import useOnPostPreview from './use-on-post-save'

// Get dismissed errors from localStorage with error handling.
const getDismissedErrors = () => {
	try {
		const dismissedErrors = JSON.parse( localStorage.getItem( 'interact-dismissed-errors' ) || '[]' )
		return Array.isArray( dismissedErrors ) ? dismissedErrors : []
	} catch ( error ) {
		return []
	}
}

// Normalize imported interaction data to ensure it has the expected structure, even if some fields are missing.
const normalizeImportedInteraction = data => {
	const timelines = data.timelines || []

	return {
		...data,
		timelines: timelines.map( timeline => {
			const actionsToImport = timeline.actions || []
			const actions = actionsToImport.map( action => (
				createNewAction( {
					actionType: action.type ?? '',
					start: action.timing?.start ?? 0,
					targetType: action.target?.type ?? '',
					props: { ...action },
				} )
			) )

			return {
				...timeline,
				actions,
			}
		} ),
	}
}

const InteractionsApp = ( {
	selectedBlockAnchor = null,
	enablePostPreviewGuard = true,
} ) => {
	const interactionLibraryMode = useSelect( select =>
		select( 'interact/interaction-library-modal' ).getMode(),
	[] )
	// Interaction library open modal and set target function.
	const {
		setMode: setInteractionLibraryMode,
		setTarget: setInteractionLibraryTarget,
	} = useDispatch( 'interact/interaction-library-modal' )

	const [ selectedInteraction, setSelectedInteraction ] = useState( null )
	const [ editPropsPassed, setEditPropsPassed ] = useState( {} )
	const [ editMode, setEditMode ] = useState( 'edit' )
	const [ isShowingError, setIsShowingError ] = useState( true )
	const [ importExportModalProps, setImportExportModalProps ] = useState( null )

	const sidebarRef = useRef()
	// This gets updated when the current interaction being edited is dirty.
	const isDirtyRef = useRef( false )

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
				window?.dispatchEvent( new CustomEvent( 'interact/save-interaction', {
					detail: {
						// This callback will be called after the interaction is saved.
						callback: proceedSaveCallback,
					},
				} ) )
				return true
			}
		}
	}

	useOnPostPreview( enablePostPreviewGuard ? onPostSaveCallback : () => {} )

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
		// If editMode is provided (e.g. when duplicating), set the editMode state accordingly.
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
		const dismissedErrors = getDismissedErrors()
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

	const { elementInteractions, pageInteractions } = interactions.reduce( ( acc, interaction ) => {
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

	const onOpenInteractionLibraryHandler = () => {
		const selectedTarget = getCurrentSelectedTarget()

		if ( ! selectedTarget ) {
			alert( __( 'Select an element in the editor first before opening the Interaction Library.', 'interactions' ) ) // eslint-disable-line no-alert
			return
		}

		setInteractionLibraryTarget( selectedTarget )
		setInteractionLibraryMode( 'apply' )
	}

	const onOpenInteractionLibraryInsertHandler = () => {
		setInteractionLibraryTarget( null )
		setInteractionLibraryMode( 'insert' )
	}

	return <>
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
								const dismissedErrors = getDismissedErrors()
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
		{ isBuilderEditor() && selectedInteraction === null &&
			<PanelBody>
				<BaseControl
					className="interact-list-control"
					label={ __( 'Interaction Library', 'interactions' ) }
				>
					<div className="interact-panel-side-buttons">
						<Button
							icon={ <LibrarySVG width="20" height="20" /> }
							onClick={ onOpenInteractionLibraryHandler }
						>
							{ __( 'Apply', 'interactions' ) }
						</Button>
						<Button
							icon={ <LibrarySVG width="20" height="20" /> }
							onClick={ onOpenInteractionLibraryInsertHandler }
						>
							{ __( 'Insert', 'interactions' ) }
						</Button>
					</div>
				</BaseControl>
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
									onImport: ( type, target, data ) => {
										onAddInteractionHandler( type, target, normalizeImportedInteraction( data ) )
									},
								} ) }
							/>
							<AddInteractionButton
								type="element"
								onAddInteraction={ onAddInteractionHandler }
							/>
						</div>
						<div>
							{ elementInteractions.map( interaction => {
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
						{ __( 'Launch page-wide transitions, backgrounds or state-based effects.', 'interactions' ) }
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
										onAddInteractionHandler( type, target, normalizeImportedInteraction( data ) )
									},
								} ) }
							/>
							<AddInteractionButton
								type="page"
								onAddInteraction={ onAddInteractionHandler }
							/>
						</div>
						<div>
							{ pageInteractions.map( interaction => {
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
	</>
}

export default InteractionsApp
