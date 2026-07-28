/**
 * Internal deprendencies
 */
import { setValueAtPath, addLoopDelayToPreview } from './util'
import { PropertyControl } from '../components/timeline/property-control'
import TargetSelector from '../components/target-selector'
import getVideoUrl from './videos'
import getConfig from './config'
import { useInteractions } from '../hooks'
import {
	openInteractionsSidebar, createNewAction, createNewInteraction,
} from '~interact/editor/util'
import {
	insertLibraryPreset,
	isBuilderEditor,
	resolveLibraryPresetTargets,
} from '~interact/editor/editors'

/**
 * External deprendencies
 */

/**
 * WordPress deprendencies
 */
import {
	Button,
	Spinner,
} from '@wordpress/components'
import { dispatch } from '@wordpress/data'
import {
	useState, useMemo, useEffect, useRef, useCallback,
} from '@wordpress/element'
import { __ } from '@wordpress/i18n'

const NOOP = () => {}

export const ConfigureModal = props => {
	const {
		selectedPreset = {},
		interactionTarget = null,
		backModal = NOOP,
		closeModal = NOOP,
		onSelectBlock = NOOP,
		mode = 'insert',
	} = props

	const [ optionValues, setOptionValues ] = useState( {} )
	const [ selectedTarget, setSelectedTarget ] = useState( interactionTarget )
	const [ sideBarEl, setSideBarEl ] = useState( null )
	const [ isApplying, setIsApplying ] = useState( !! selectedPreset.skipConfig )
	const didAutoApplyRef = useRef( false )
	const selectedTargetLabel = isBuilderEditor()
		? __( 'This interaction will be applied to the selected element. Click here to modify.', 'interactions' )
		: __( 'This interaction will be applied to the selected block. Click here to modify.', 'interactions' )

	useEffect( () => {
		// Set the editor sidebar as anchor for target selector
		setSideBarEl(
			document.querySelector( '.interface-interface-skeleton__sidebar, .interact-pagebuilder-sidebar' ) || null
		)
	}, [] )

	useEffect( () => {
		didAutoApplyRef.current = false
	}, [ selectedPreset ] )

	useEffect( () => {
		setIsApplying( !! selectedPreset.skipConfig )
	}, [ selectedPreset ] )

	const interactionSetup = useMemo( () => ( selectedPreset.interactionSetup ), [ selectedPreset ] )
	const configurableOptions = useMemo( () => selectedPreset.configurableOptions ?? [], [ selectedPreset ] )

	const {
		updateInteraction,
	} = useInteractions()

	const handleApply = useCallback( async () => {
		setIsApplying( true )

		const config = getConfig( selectedPreset.config )
		let isRunDefaultConfig = true
		// Allow an entry to handle configurations and block generation for complex interactions
		if ( config ) {
			try {
				isRunDefaultConfig = config( selectedPreset, optionValues, interactionSetup )
			} catch ( error ) {
				console.error( 'Interactions Library configuration error:', error.message ) // eslint-disable-line no-console
				isRunDefaultConfig = false
			}
		}

		if ( isRunDefaultConfig ) {
			// Edit the timelines based on the user's configuration
			configurableOptions.forEach( option => {
				const value = optionValues[ option.key ] ?? option.controls.default ?? ''
				option.mappings.forEach( mapping => {
					const transformFn = getConfig( mapping.transformFn ) ?? ( v => v )
					const transformedValue = transformFn( value )
					setValueAtPath( interactionSetup, mapping.path, transformedValue )
				} )
			} )

			// In insert mode, let the active editor adapter own how preset content
			// is created so this modal no longer depends on Gutenberg block APIs.
			if ( mode === 'insert' ) {
				const insertedContent = await insertLibraryPreset( selectedPreset )
				if ( ! insertedContent ) {
					setIsApplying( false )
					return
				}

				resolveLibraryPresetTargets( interactionSetup, selectedPreset, insertedContent )
			} else if ( mode === 'apply' ) {
				resolveLibraryPresetTargets( interactionSetup, selectedPreset, selectedTarget )
			}
		}

		// Ensure the interactions are in an array format
		const interactions = Array.isArray( interactionSetup )
			? interactionSetup
			: [ interactionSetup ]

		// Create new actions based on import to regenerate action key
		// and fill missing properties with defaults.
		interactions.forEach( ( interaction, index, array ) => {
			const timelines = interaction.timelines ?? []
			interaction.timelines = timelines.map( timeline => {
				const actions = ( timeline.actions ?? [] ).map( action =>
					createNewAction( {
						actionType: action.type ?? '',
						start: action.timing?.start ?? 0,
						targetType: action.target?.type ?? '',
						props: { ...action },
					} )
				)

				return { ...timeline, actions }
			} )

			// Bypass anchor change confirmation since the change is only for the newly created block.
			dispatch( 'interact/interactions' ).setDidModifyPostContent( false )

			// Save through the editor if it's the last interaction
			if ( index === array.length - 1 ) {
				// Close the modal and open the interactions sidebar
				// before dispatching the event to add the interaction.
				closeModal()
				openInteractionsSidebar()

				setTimeout( () => {
					window.dispatchEvent( new window.CustomEvent( 'interact/add-interaction', {
						detail: {
							type: interaction?.type ?? '',
							target: interaction.target,
							props: interaction,
						},
					} ) )
					window?.dispatchEvent( new CustomEvent( 'interact/save-interaction' ) )
				}, 100 )
			} else {
				const newInteraction = createNewInteraction(
					interaction?.type ?? '',
					interaction.target,
					interaction,
				)
				updateInteraction( newInteraction )
			}
		} )

		setIsApplying( false )
	}, [
		closeModal,
		configurableOptions,
		interactionSetup,
		mode,
		optionValues,
		selectedPreset,
		selectedTarget,
		updateInteraction,
	] )

	useEffect( () => {
		// Auto-apply skip-config presets once after the modal mounts for the
		// selected preset, instead of triggering inserts during render.
		if ( ! selectedPreset.skipConfig || didAutoApplyRef.current ) {
			return
		}

		didAutoApplyRef.current = true
		handleApply()
	}, [ selectedPreset, handleApply ] )

	// Skip-config presets apply immediately and do not render controls.
	if ( selectedPreset.skipConfig ) {
		return (
			<div
				className="interact-interaction-library__configure-loading"
				style={ {
					minHeight: '260px',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '12px',
					textAlign: 'center',
				} }
			>
				<Spinner />
				<p style={ { margin: 0 } }>
					{ mode === 'insert'
						? __( 'Inserting interaction…', 'interactions' )
						: __( 'Applying interaction…', 'interactions' )
					}
				</p>
			</div>
		)
	}

	return (
		<>
			<div className="interact-interaction-library__back-button-wrapper">
				<Button
					className="interact-interaction-library__back-button"
					onClick={ backModal }
					icon="arrow-left-alt2"
					variant="tertiary"
				>
					{ __( 'Back to Library', 'interactions' ) }
				</Button>
			</div>
			<div className="interact-interaction-library__configure-scroll-wrapper">
				<div className="interact-interaction-library__configure-wrapper">
					<div className="interact-interaction-library__configure-left">
						<video
							autoPlay
							muted
							className="interact-interaction-library__configure__preset-preview"
							onEnded={ e => addLoopDelayToPreview( e, 1000 ) }
						>
							<source src={ getVideoUrl( selectedPreset.preview ) } type="video/mp4" />
						</video>
						<p className="interact-interaction-library__preset-description">{ selectedPreset.description }</p>
					</div>

					<div className="interact-interaction-library__configure-middle">
						<h2>{ __( 'Customize interaction', 'interactions' ) }</h2>
						{ configurableOptions.map( option => {
							return (
								<div className="interact-interaction-library__configure__control" key={ option.key }>
									<PropertyControl
										property={ {
											enforceMinMax: true, // Enforce the min and max for all interactions by default
											...option.controls,
										} }
										value={ optionValues[ option.key ] ?? option.controls?.default ?? '' }
										onChange={ newValue => {
											setOptionValues( {
												...optionValues,
												[ option.key ]: newValue,
											} )
										} }
									/>
								</div>
							)
						} ) }

						{ mode === 'apply' && (
							<details className="interact-interaction-library__configure__target-selector">
								<summary>
									{ selectedTargetLabel }
								</summary>
								<TargetSelector
									isHorizontal={ false }
									assignBlockIdOnPick
									anchor={ sideBarEl }
									offset={ 12 }
									noArrow={ true }
									value={ selectedTarget ?? undefined }
									onChange={ _target => {
										setSelectedTarget( _target )
									} }
									onBlockSelectClick={ () => onSelectBlock( true ) }
									onBlockSelectDone={ () => onSelectBlock( false ) }
								/>
							</details>
						) }
					</div>
				</div>
			</div>
			<div className="interact-interaction-library__configure__apply-button">
				<Button
					variant="primary"
					className="interact-interaction-library__configure__apply-button__button"
					disabled={ isApplying }
					onClick={ handleApply }
				>
					{ isApplying
						? (
							mode === 'insert'
								? __( 'Inserting…', 'interactions' )
								: __( 'Applying…', 'interactions' )
						)
						: (
							mode === 'insert'
								? __( 'Insert Interaction', 'interactions' )
								: __( 'Apply Interaction', 'interactions' )
						) }
				</Button>
			</div>
		</>
	)
}
