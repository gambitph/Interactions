/**
 * Internal deprendencies
 */
import './store'
import { SelectModal } from './select-modal'
import { ConfigureModal } from './configure-modal'
import { isPresetApplicable, useInteractionPresets } from './util'

/**
 * External deprendencies
 */
import { GuidedModalTour } from '~interact/editor/components'

/**
 * WordPress deprendencies
 */
import {
	Modal, SearchControl, Spinner,
} from '@wordpress/components'
import {
	useState, useEffect, useMemo,
} from '@wordpress/element'
import { useDispatch, useSelect } from '@wordpress/data'
import { __ } from '@wordpress/i18n'

const INSERT_CATEGORIES = [
	{
		name: __( 'Favorites', 'interactions' ),
		value: 'favorites',
	},
	{
		name: __( 'All', 'interactions' ),
		value: 'all',
	},
	{
		name: __( 'Hero', 'interactions' ),
		value: 'hero',
		description: __( 'Interactions for heroes', 'interactions' ),
	},
	{
		name: __( 'Columns', 'interactions' ),
		value: 'columns',
		description: __( 'Interactions for columns', 'interactions' ),
	},
	{
		name: __( 'Card', 'interactions' ),
		value: 'card',
		description: __( 'Interactions for cards', 'interactions' ),
	},
	{
		name: __( 'Image', 'interactions' ),
		value: 'image',
		description: __( 'Interactions for images', 'interactions' ),
	},
	{
		name: __( 'Video', 'interactions' ),
		value: 'video',
		description: __( 'Interactions for videos', 'interactions' ),
	},
	{
		name: __( 'Button', 'interactions' ),
		value: 'button',
		description: __( 'Interactions for buttons', 'interactions' ),
	},
	{
		name: __( 'Text', 'interactions' ),
		value: 'text',
		description: __( 'Interactions for buttons', 'interactions' ),
	},
	{
		name: __( 'Details', 'interactions' ),
		value: 'details',
		description: __( 'Interactions for details', 'interactions' ),
	},
	{
		name: __( 'Calculator', 'interactions' ),
		value: 'calculator',
		description: __( 'Interactions for different types of calculator', 'interactions' ),
	},
]

const APPLY_CATEGORIES = [
	{
		name: __( 'Favorites', 'interactions' ),
		value: 'favorites',
	},
	{
		name: __( 'All', 'interactions' ),
		value: 'all',
	},
	{
		name: __( 'Click Effects', 'interactions' ),
		value: 'click',
		description: __( 'Interactions for click effects', 'interactions' ),
	},
	{
		name: __( 'Hover Effects', 'interactions' ),
		value: 'hover',
		description: __( 'Interactions for hover effects', 'interactions' ),
	},
	{
		name: __( 'Scroll Effects', 'interactions' ),
		value: 'scroll',
		description: __( 'Interactions for scroll effects', 'interactions' ),
	},
	{
		name: __( 'Looped Effects', 'interactions' ),
		value: 'looped',
		description: __( 'Interactions for looped effects', 'interactions' ),
	},
	{
		name: __( 'Entrance', 'interactions' ),
		value: 'entrance',
		description: __( 'Interactions for entrance animation', 'interactions' ),
	},
	{
		name: __( 'Advanced', 'interactions' ),
		value: 'advanced',
		description: __( 'Interactions for advanced animation', 'interactions' ),
	},
]

export const InteractionLibrary = () => {
	const {
		interactionTarget, interactionMode, favorites,
	} = useSelect( select => {
		const state = select( 'interact/interaction-library-modal' )
		return {
			interactionTarget: state.interactionTarget(),
			interactionMode: state.getMode(),
			favorites: state.getFavorites(),
		}
	}, [] )

	const {
		setMode, setTarget, setFavorites,
	} = useDispatch( 'interact/interaction-library-modal' )

	const [ selectedPreset, setSelectedPreset ] = useState( null )
	const [ searchQuery, setSearchQuery ] = useState( '' )
	const [ isSelectingBlock, setIsSelectingBlock ] = useState( false )
	const [ interactionPresets, isLoadingPresets ] = useInteractionPresets()

	const adjustedCategories = useMemo( () => (
		interactionMode === 'apply'
			? APPLY_CATEGORIES
			: INSERT_CATEGORIES
	), [ interactionMode ] )

	// Build a priority map for faster lookup
	const categoryPriority = adjustedCategories.reduce( ( acc, c, i ) => {
		acc[ c.value ] = i
		return acc
	}, {} )

	// Sort all first based on applicability and categories.
	const sortedPresets = useMemo( () => {
		let applicable = []
		const notApplicable = []

		if ( interactionTarget?.blockName ) {
			interactionPresets.forEach( preset => {
				if ( isPresetApplicable( preset, interactionTarget.blockName ) ) {
					applicable.push( { ...preset, isApplicable: true } )
				} else {
					notApplicable.push( { ...preset, isApplicable: false } )
				}
			} )
		} else {
			applicable = interactionPresets
		}

		// Make a sorter function
		const sorter = ( a, b ) => {
			// Sort based on categories
			// Use infinity as fallback
			const catDiff =
			( categoryPriority[ a.category ] ?? Infinity ) -
			( categoryPriority[ b.category ] ?? Infinity )
			if ( catDiff !== 0 ) {
				return catDiff
			}

			// If same category, sort alphabetically
			return a.name.localeCompare( b.name, undefined, { numeric: true } )
		}

		// Sort individually and merge after
		applicable.sort( sorter )
		notApplicable.sort( sorter )

		return [ ...applicable, ...notApplicable ]
	}, [ interactionTarget, categoryPriority, interactionPresets ] )

	const handleClose = () => {
		// Close the modal and reset the interaction library target.
		setMode( null )
		setTarget( null )
	}

	const handleBack = () => {
		// Reset the search query and selected preset.
		setSearchQuery( '' )
		setSelectedPreset( null )
	}

	useEffect( () => {
		// When selecting a block as target, hide the modal screen overlay temporarily.
		const overlay = document.querySelector( '.components-modal__screen-overlay' )

		if ( ! overlay ) {
			return
		}

		if ( isSelectingBlock ) {
			overlay.style.width = '0'
			overlay.style.height = '0'
			overlay.style.overflow = 'hidden'
		} else {
			overlay.style.removeProperty( 'width' )
			overlay.style.removeProperty( 'height' )
			overlay.style.removeProperty( 'overflow' )
		}
	}, [ isSelectingBlock ] )

	return (
		<Modal
			title={ <>
				{ __( 'Interaction Library', 'interactions' ) }
				{ selectedPreset &&
					' › ' + selectedPreset?.name
				 }
				{ ! selectedPreset && (
					<SearchControl
						className="interact-interaction-library-modal__search"
						placeholder={ __( 'Search interactions…', 'interactions' ) }
						value={ searchQuery }
						onChange={ value => setSearchQuery( value ) }
					/>
				) }
			</> }
			className="interact-interaction-library-modal"
			onRequestClose={ handleClose }
		>
			<GuidedModalTour tourId="interaction-library" />
			{ isLoadingPresets ? (
				<div style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '2rem',
				} }>
					<Spinner />
				</div>
			) : ! selectedPreset ? (
				<SelectModal
					presets={ sortedPresets }
					categories={ adjustedCategories }
					favorites={ favorites }
					setFavorites={ setFavorites }
					onSelect={ setSelectedPreset }
					searchQuery={ searchQuery }
					mode={ interactionMode }
				/>
			) : (
				<ConfigureModal
					selectedPreset={ selectedPreset }
					interactionTarget={ interactionTarget }
					backModal={ handleBack }
					closeModal={ handleClose }
					onSelectBlock={ setIsSelectingBlock }
					mode={ interactionMode }
				/>
			) }
		</Modal>
	)
}
