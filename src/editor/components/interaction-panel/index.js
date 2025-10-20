import {
	LocationRules, Timeline, Separator,
} from '~interact/editor/components'
import { interactions as interactionsConfig } from 'interactions'
import { cloneDeep } from 'lodash'
import classNames from 'classnames'

import { __, sprintf } from '@wordpress/i18n'
import {
	PanelBody,
	Button,
	ToggleControl,
	TextControl,
	SelectControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components'
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useLayoutEffect,
} from '@wordpress/element'
import { Icon, download } from '@wordpress/icons'
import TargetSelector from '../target-selector'
import { getInteractionWarning } from './util'

const NOOP = () => {}

const maybeRestartPreview = () => {
	window.dispatchEvent( new CustomEvent( 'interact/timeline-restart-preview' ) )
}

// Holds the current editing state of the interaction. This is used to keep
// track of what we're editing when the side panel has been closed and
// re-opened.
const currentEditingState = {
	interaction: null,
	isDirty: false,
}

// Grabs the initial interaction, if the key is the same as the one we have in
// memory, then it means that we were previously editing this interaction and it
// suddenly unmounted (e.g. because the user switched from the Interactions sidebar to
// the block editor sidebar and back again), in this case, we should keep the
// state of the interaction.
const getInitialInteraction = passedInteraction => {
	// If the same key, then use the one we have in memory.
	if ( currentEditingState.interaction?.key === passedInteraction.key ) {
		return currentEditingState.interaction
	}
	return cloneDeep( passedInteraction )
}
// Same as the interaction, but for the isDirty state so that the discard and
// save buttons are preserved.
const getInitialIsDirty = ( passedInitialDirty, passedInteraction ) => {
	// If the same key, then use the one we have in memory.
	if ( currentEditingState.interaction?.key === passedInteraction.key ) {
		return currentEditingState.isDirty
	}
	return passedInitialDirty
}

const InteractionPanel = props => {
	const {
		editMode = 'edit',
		onChange = NOOP,
		onClose = NOOP,
		onDelete = NOOP,
		initialDirty = props.editMode === 'new',
		onDirtyChange = NOOP,
		onOpenImportExportModal = NOOP,
	} = props

	const [ editedInteraction, setEditedInteraction ] = useState( () => getInitialInteraction( props.interaction ) )
	const [ isDirty, setIsDirty ] = useState( () => getInitialIsDirty( initialDirty, props.interaction ) )
	const [ status, setStatus ] = useState( 'idle' )

	const nameInputRef = useRef()
	const backButtonRef = useRef()
	const controlsRef = useRef()

	// Keep track of all changes in the interaction and the state of the editing.
	useEffect( () => {
		currentEditingState.interaction = editedInteraction
		currentEditingState.isDirty = isDirty
	}, [ editedInteraction, isDirty ] )

	// If the interaction changes, then it means we will start to edit a different interaction.
	useEffect( () => {
		// If we have something cached, then do not update the state since we
		// will be continuing from the previous state of the editor.
		if ( currentEditingState.interaction?.key === props.interaction.key ) {
			return
		}
		setEditedInteraction( cloneDeep( props.interaction ) )
		setIsDirty( props.editMode === 'new' || props.initialDirty )
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ props.interaction ] )

	const resetEditedInteraction = () => {
		setEditedInteraction( cloneDeep( props.interaction ) )
		setIsDirty( false )
	}

	// Let the main parent editor know that we currently have unsaved edits.
	useEffect( () => {
		onDirtyChange( isDirty )
	}, [ onDirtyChange, isDirty ] )

	// Autofocus on the interaction name input when the panel opens.
	useEffect( () => {
		if ( editMode === 'new' && nameInputRef.current ) {
			nameInputRef.current.focus()
		} else if ( editMode === 'edit' && backButtonRef.current ) {
			backButtonRef.current.focus()
		}
	}, [ editMode ] )

	// TODO: options that are required should show a warning if leaving or
	// saving and there is no value yet (only if the option is require = true)

	// TODO: if no interaction target, show a warning if leaving or saving

	// Prevent leaving page if there are still unsaved changes.
	useEffect( () => {
		// @from https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
		const stopLeaveHandler = () => {
			if ( isDirty ) {
				event.preventDefault()
				return ( event.returnValue = 'd wqdwq' )
			}
		}
		window.addEventListener( 'beforeunload', stopLeaveHandler, { capture: true } )
		return () => window.removeEventListener( 'beforeunload', stopLeaveHandler, { capture: true } )
	}, [ isDirty ] )

	// TODO: validate if props.interaction is valid, and show an error if it's
	// not valid. We need to do this or else the entire editor will show an
	// error.

	// In WP 6.6 the controls go past the scrollbar, this fixes it.
	useLayoutEffect( () => {
		if ( controlsRef.current?.parentElement ) {
			controlsRef.current.style.width = controlsRef.current.parentElement.clientWidth + 'px'
		}
	}, [] )

	const onChangeActions = ( i, actions ) => {
		setEditedInteraction( interaction => {
			const newInteraction = { ...interaction }
			if ( ! newInteraction.timelines[ i ] ) {
				newInteraction.timelines[ i ] = {}
			}
			newInteraction.timelines[ i ].actions = actions
			// Sort by start time.
			newInteraction.timelines[ i ].actions.sort( ( a, b ) => a.timing.start - b.timing.start )
			return newInteraction
		} )
		setIsDirty( true )
	}

	const onChangeTimelineOption = ( i, options ) => {
		setEditedInteraction( interaction => {
			const newInteraction = { ...interaction }
			newInteraction.timelines[ i ] = {
				...newInteraction.timelines[ i ],
				...options,
			}
			return newInteraction
		} )
		setIsDirty( true )
	}

	const onChangeLocations = locations => {
		setEditedInteraction( interaction => {
			const newInteraction = { ...interaction }
			newInteraction.locations = locations
			return newInteraction
		} )
		setIsDirty( true )
	}

	const interactionConfig = interactionsConfig[ editedInteraction.type ]

	// Get the warning message if there is any.
	const interactionWarnings = getInteractionWarning( editedInteraction, interactionConfig.type )

	const onCloseHandler = useCallback( () => {
		if ( isDirty ) {
			if ( confirm( __( 'Are you sure you want to discard your changes?', 'interactions' ) ) ) { // eslint-disable-line no-alert
				onClose( true )
			}
			return
		}
		onClose( true )
	}, [ isDirty, onClose ] )

	const onDeleteHandler = () => {
		// Confirm if we want to delete this interaction.
		if ( confirm( __( 'Are you sure you want to delete this interaction?', 'interactions' ) ) ) { // eslint-disable-line no-alert
			setStatus( 'deleting' )
			onDelete().then( () => {
				onClose()
			} )
		}
	}

	const onDiscardHandler = () => {
		// Confirm if we want to discard changes.
		if ( confirm( __( 'Are you sure you want to discard your changes?', 'interactions' ) ) ) { // eslint-disable-line no-alert
			resetEditedInteraction()
		}
	}

	const onDiscardNewHandler = useCallback( () => {
		// Confirm if we want to discard changes.
		if ( confirm( __( 'Are you sure you want to discard your changes?', 'interactions' ) ) ) { // eslint-disable-line no-alert
			onClose()
		}
	}, [ onClose ] )

	const onPublishHandler = useCallback( callback => {
		setStatus( 'publishing' )
		// TODO: if publishing and then we are missing a target, we should show a notice.
		onChange( editedInteraction ).then( () => {
			setStatus( 'idle' )
			setIsDirty( false )
			if ( callback ) {
				setTimeout( callback, 1 ) // Need a timeout here because re-publishing may be too fast.
			}
		} )
	}, [ editedInteraction, onChange ] )

	// Listen if the editor wants to save the interaction.
	useEffect( () => {
		// The event's detail should contain the callback function.
		const onSaveInteractionEventHandler = event => {
			// If a callback function was supplied, call it.
			onPublishHandler( event.detail?.callback )
		}

		window?.addEventListener( 'interact/save-interaction', onSaveInteractionEventHandler )
		return () => {
			window?.removeEventListener( 'interact/save-interaction', onSaveInteractionEventHandler )
		}
	}, [ onPublishHandler ] )

	// Listen if the editor is being closed.
	useEffect( () => {
		const onCloseInteractionEventHandler = () => {
			if ( editMode === 'new' ) {
				onDiscardNewHandler()
			} else {
				onCloseHandler()
			}
		}

		window?.addEventListener( 'interact/close-interaction', onCloseInteractionEventHandler )
		return () => {
			window?.removeEventListener( 'interact/close-interaction', onCloseInteractionEventHandler )
		}
	}, [ editMode, onDiscardNewHandler, onCloseHandler ] )

	return (
		<>
			<div
				className="interact-interaction-card-controls interface-complementary-area edit-post-sidebar"
				ref={ controlsRef }
			>
				<Button
					variant="secondary"
					icon="arrow-left-alt2"
					label={ __( 'Back', 'interactions' ) }
					ref={ backButtonRef }
					onClick={ editMode === 'new' ? onDiscardNewHandler : onCloseHandler }
					onKeyDown={ ev => {
						if ( ev.key === 'Escape' ) {
							ev.preventDefault()
							ev.stopPropagation()
							if ( editMode === 'new' ) {
								onDiscardNewHandler()
							} else {
								onCloseHandler()
							}
						}
					} }
					disabled={ status !== 'idle' }
					showTooltip={ false }
				/>
				{ editMode === 'edit' && (
					<Button
						variant="tertiary"
						isDestructive
						icon="trash"
						label={ __( 'Delete Interaction', 'interactions' ) }
						onClick={ onDeleteHandler }
						isBusy={ status === 'deleting' }
						disabled={ status !== 'idle' }
					/>
				) }
				{ ( isDirty || editMode === 'new' ) && (
					<>
						<Button
							isDestructive
							label={ __( 'Discard Changes', 'interactions' ) }
							onClick={ editMode === 'new' ? onDiscardNewHandler : onDiscardHandler }
							disabled={ status !== 'idle' }
						>
							{ __( 'Discard', 'interactions' ) }
						</Button>
						<Button
							variant="primary"
							label={ __( 'Save Changes', 'interactions' ) }
							onClick={ () => {
								// If there's no trigger, then show a warning.
								if ( interactionWarnings?.type === 'no-trigger' ) {
									const panel = document.querySelector( '.interact-panel-interaction-trigger' )
									if ( panel ) {
										if ( ! panel.classList.contains( 'is-opened' ) ) {
											panel.querySelector( 'button' ).click()
										}
										panel.scrollIntoView( { behavior: 'smooth', block: 'center' } )
										setTimeout( () => {
											panel.classList.add( 'interact-panel-blink' )
											setTimeout( () => {
												panel?.classList.remove( 'interact-panel-blink' )
											}, 1500 )
										}, 100 )
										return
									}
								}

								onPublishHandler()
							} }
							isBusy={ status === 'publishing' }
							disabled={ status !== 'idle' }
						>
							{ __( 'Save', 'interactions' ) }
						</Button>
					</>
				) }
			</div>
			<div className="interact-interaction-card">
				<h2>{
					editMode === 'new'
						// Translators: %s is the interaction name.
						? sprintf( __( 'New %s', 'interactions' ), interactionConfig.name )
						// Translators: %s is the interaction name.
						: sprintf( __( 'Editing %s', 'interactions' ), interactionConfig.name )
				}</h2>
				<p className="interact-panel-description">{ interactionConfig.description }</p>
				<ToggleControl
					label={ editedInteraction.active ? __( 'Active', 'interactions' ) : __( 'Inactive', 'interactions' ) }
					checked={ editedInteraction.active }
					className={ classNames( 'interact-interaction__active-toggle', { 'is-active': editedInteraction.active } ) }
					onChange={ active => {
						setEditedInteraction( interaction => {
							return {
								...interaction,
								active,
							}
						} )
						setIsDirty( true )
					} }
				/>
				<TextControl
					label={ __( 'Interaction Name', 'interactions' ) }
					ref={ nameInputRef }
					value={ editedInteraction.title }
					onChange={ title => {
						setEditedInteraction( interaction => {
							return {
								...interaction,
								title,
							}
						} )
						setIsDirty( true )
					} }
					placeholder={ interactionConfig.name }
				/>
			</div>

			{ interactionConfig.options.length > 0 && (
				<PanelBody
					title={ __( 'Settings', 'interactions' ) }
					initialOpen={ true }
				>
					{ interactionConfig.options.map( option => {
						const { type, condition } = option
						const propsToPass = {}

						const Tag = type === 'number' ? NumberControl
							: type === 'select' ? SelectControl
								: type === 'toggle' ? ToggleControl
									: TextControl

						if ( type === 'toggle' ) {
							if ( typeof editedInteraction.options?.[ option.name ] !== 'undefined' ) {
								propsToPass.checked = editedInteraction.options?.[ option.name ]
							} else { // Default value
								propsToPass.checked = option.placeholder || false
							}
						}

						// Conditionally display the option.
						if ( condition ) {
							const { option, value } = condition
							const defaultValue = interactionConfig.options.find( o => o.name === option )?.placeholder
							const currentValue = typeof editedInteraction.options?.[ option ] !== 'undefined' ? editedInteraction.options?.[ option ] : defaultValue
							if ( currentValue !== value ) {
								return null
							}
						}

						return (
							<Tag
								{ ...option }
								key={ option.name }
								value={ editedInteraction.options?.[ option.name ] || '' }
								onChange={ value => {
									setEditedInteraction( interaction => {
										return {
											...interaction,
											options: {
												...interaction.options,
												[ option.name ]: value,
											},
										}
									} )
									setIsDirty( true )
									maybeRestartPreview()
								} }
								{ ...propsToPass }
							/>
						)
					} ) }
				</PanelBody>
			) }

			{ interactionConfig.timelines.map( ( actionSlot, i ) => {
				const timelineConfig = interactionConfig.timelines[ i ]
				const {
					onceOnly = true,
					alwaysReset = true,
				} = timelineConfig

				return (
					<PanelBody
						key={ i }
						title={ actionSlot.title }
					>
						{ actionSlot.description && <p className="interact-panel-description">{ actionSlot.description }</p> }
						<Timeline
							type={ interactionConfig.timelineType }
							actions={ editedInteraction.timelines[ i ]?.actions || [] }
							onChange={ actions => onChangeActions( i, actions ) }
							interaction={ editedInteraction }
							timelineIndex={ i }
							onOpenImportExportModal={ onOpenImportExportModal }
							onImportTimeline={ onChangeTimelineOption }
						/>
						{ interactionConfig.timelineType === 'time' && (
							<>
								<Separator />
								<h4>{ __( 'Timeline Options', 'interactions' ) }</h4>
								{ onceOnly &&
									<ToggleControl
										label={ __( 'Once only', 'interactions' ) }
										checked={ editedInteraction.timelines[ i ]?.onceOnly || false }
										onChange={ onceOnly => onChangeTimelineOption( i, { onceOnly } ) }
									/>
								}
								{ alwaysReset &&
									<ToggleControl
										label={ __( 'Always reset', 'interactions' ) }
										checked={ editedInteraction.timelines[ i ]?.reset || false }
										onChange={ reset => onChangeTimelineOption( i, { reset } ) }
									/>
								}
								<ToggleControl
									label={ __( 'Play reversed', 'interactions' ) }
									checked={ editedInteraction.timelines[ i ]?.reverse || false }
									onChange={ reverse => {
										onChangeTimelineOption( i, { reverse } )
										maybeRestartPreview()
									} }
								/>
								<ToggleControl
									label={ __( 'Alternate', 'interactions' ) }
									checked={ editedInteraction.timelines[ i ]?.alternate || false }
									onChange={ alternate => {
										onChangeTimelineOption( i, { alternate } )
										maybeRestartPreview()
									} }
								/>
								<ToggleControl
									label={ __( 'Loop', 'interactions' ) }
									checked={ editedInteraction.timelines[ i ]?.loop || false }
									onChange={ loop => {
										onChangeTimelineOption( i, { loop } )
										maybeRestartPreview()
									} }
								/>
								{ editedInteraction.timelines[ i ]?.loop &&
									<>
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Loop times', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 5 }
											step={ 1 }
											min={ 1 }
											disableUnits
											placeholder={ __( 'Infinite', 'interactions' ) }
											value={ editedInteraction.timelines[ i ]?.loopTimes }
											onChange={ value => {
												let newValue = parseInt( value )
												if ( isNaN( newValue ) || newValue < 1 ) {
													newValue = ''
												}
												onChangeTimelineOption( i, { loopTimes: newValue } )
												maybeRestartPreview()
											} }
										/>
										<NumberControl
											__unstableInputWidth="90px"
											label={ __( 'Loop delay', 'interactions' ) }
											isShiftStepEnabled
											isDragEnabled
											labelPosition="edge"
											shiftStep={ 0.1 }
											step={ 0.01 }
											min={ 0 }
											disableUnits
											placeholder="0.0"
											suffix="s"
											value={ editedInteraction.timelines[ i ]?.loopDelay }
											onChange={ value => {
												let newValue = parseFloat( value )
												if ( isNaN( newValue ) ) {
													newValue = 0
												}
												onChangeTimelineOption( i, { loopDelay: newValue } )
												maybeRestartPreview()
											} }
										/>
									</>
								}
								<Separator />
								<ToggleControl
									label={ __( 'Debug Mode', 'interactions' ) }
									help={ __( 'Show debugging info in the frontend when this timeline plays.', 'interactions' ) }
									checked={ editedInteraction.timelines[ i ]?.debug || false }
									onChange={ debug => {
										onChangeTimelineOption( i, { debug } )
										maybeRestartPreview()
									} }
								/>
							</>
						) }
						{ interactionConfig.timelineType === 'percentage' && (
							<>
								<Separator />
								<h4>{ __( 'Timeline Options', 'interactions' ) }</h4>
								<ToggleControl
									label={ __( 'Debug Mode', 'interactions' ) }
									help={ __( 'Show debugging info in the frontend when this timeline plays.', 'interactions' ) }
									checked={ editedInteraction.timelines[ i ]?.debug || false }
									onChange={ debug => {
										onChangeTimelineOption( i, { debug } )
										maybeRestartPreview()
									} }
								/>
							</>
						) }
					</PanelBody>
				)
			} ) }

			{ interactionConfig.type === 'element' && (
				<PanelBody
					title={ __( 'Interaction Trigger', 'interactions' ) }
					initialOpen={ false }
					className="interact-panel-interaction-trigger"
				>
					{ interactionWarnings && <span className="interact-warning-text">{ interactionWarnings.message }</span> }
					<TargetSelector
						horizontalTypes={ [] }
						assignBlockIdOnPick
						value={ editedInteraction.target }
						onChange={ target => {
							setEditedInteraction( interaction => {
								return {
									...interaction,
									target,
								}
							} )
							setIsDirty( true )
						} }
					/>
				</PanelBody>
			) }

			<PanelBody
				title={ __( 'Location Rules', 'interactions' ) }
				initialOpen={ false }
			>
				<LocationRules locations={ editedInteraction.locations } onChange={ onChangeLocations } />
			</PanelBody>

			<PanelBody>
				<em style={ { fontSize: 12 } }>{ sprintf( __( 'Interaction key: %s', 'interactions' ), editedInteraction.key ) }</em>
				<div className="interact-export-container">
					<Button
						variant="secondary"
						icon={ <Icon icon={ download } /> }
						label={ __( 'Export interaction', 'interactions' ) }
						onClick={ () => {
							onOpenImportExportModal( {
								title: __( 'Export Interaction', 'interactions' ),
								description: <p>{ __( 'To export, simply copy the interaction JSON shown below and save it for later use or sharing.', 'interactions' ) }</p>,
								interaction: editedInteraction,
								hasExport: true,
							} )
						} }
					>
						{ __( 'Export Interaction', 'interactions' ) }
					</Button>
				</div>
			</PanelBody>

			{ /* <PanelBody
				title={ __( 'Conditions', 'interactions' ) }
				initialOpen={ false }
			>
				<p>{ __( 'Enable interaction on these screen sizes', 'interactions' ) }</p>
				<ToggleControl label={ __( 'Desktop', 'interactions' ) } checked={ true } />
				<ToggleControl label={ __( 'Tablet', 'interactions' ) } checked={ true } />
				<ToggleControl label={ __( 'Mobile', 'interactions' ) } checked={ true } />
			</PanelBody> */ }
		</>
	)
}

export default InteractionPanel
