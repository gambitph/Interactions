/**
 * Internal deprendencies
 */
import {
	setValueAtPath, addLoopDelayToPreview, applyTargetMappings,
} from './util'
import { PropertyControl } from '../components/timeline/property-control'
import TargetSelector from '../components/target-selector'
import getVideoUrl from './videos'
import getConfig from './config'
import { useInteractions } from '../hooks'
import {
	openInteractionsSidebar, createNewAction, createNewInteraction,
} from '~interact/editor/util'

/**
 * External deprendencies
 */

/**
 * WordPress deprendencies
 */
import { Button } from '@wordpress/components'
import { parse } from '@wordpress/blocks'
import { dispatch } from '@wordpress/data'
import {
	useState, useMemo, useEffect,
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

	useEffect( () => {
		// Set the editor sidebar as anchor for target selector
		setSideBarEl( document.querySelector( '.interface-interface-skeleton__sidebar' ) || null )
	}, [] )

	const interactionSetup = useMemo( () => ( selectedPreset.interactionSetup ), [ selectedPreset ] )
	const configurableOptions = useMemo( () => selectedPreset.configurableOptions ?? [], [ selectedPreset ] )

	const {
		updateInteraction,
	} = useInteractions()

	const handleApply = () => {
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

			const targetMappings = selectedPreset.targetMappings

			// If mode is inset, create a new block based on the seralized example.
			// Otherwise, use the target from target selector.
			if ( mode === 'insert' ) {
				const block = parse( selectedPreset.serializedBlockExample ?? '' )[ 0 ]
				if ( ! block ) {
					return
				}
				dispatch( 'core/block-editor' ).insertBlocks( block )

				// If target mappings are provided, dynamically create target for each.
				applyTargetMappings( interactionSetup, targetMappings, block, )
			} else if ( mode === 'apply' ) {
				applyTargetMappings( interactionSetup, targetMappings, selectedTarget )
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
				// Create the new interaction
				window.dispatchEvent( new window.CustomEvent( 'interact/add-interaction', {
					detail: {
						type: interaction?.type ?? '',
						target: interaction.target,
						props: interaction,
					},
				} ) )

				setTimeout( () => {
					window?.dispatchEvent( new CustomEvent( 'interact/save-interaction' ) )
					dispatch( 'core/editor' ).savePost()
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

		// Close the modal, and open the sidebar for the new interaction.
		closeModal()
		openInteractionsSidebar()
	}

	// If skipConfig is true, just apply the interaction user without configuration.
	if ( selectedPreset.skipConfig ) {
		handleApply()
		return null
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
									{ __( 'This interaction will be applied to the selected block. Click here to modify.', 'interactions' ) }
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
					onClick={ handleApply }
				>
					{ mode === 'insert'
						? __( 'Insert Interaction', 'interactions' )
						: __( 'Apply Interaction', 'interactions' )
					}
				</Button>
			</div>
		</>
	)
}
