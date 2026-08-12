
/* Elementor setting names follow Elementor's snake_case schema. */
/* eslint-disable camelcase */
import { parse } from '@wordpress/blocks'
import { dispatch } from '@wordpress/data'
import { createTargetObj, shuffleArray } from '.././util'
import { isElementorEditor } from '~interact/editor/editors'

/**
 * Read the first image URL from a serialized Gutenberg image example.
 *
 * @param {string} serializedBlock Serialized block markup.
 *
 * @return {string} Decoded image URL.
 */
const getImageUrl = serializedBlock => {
	const imageUrl = serializedBlock.match( /<img[^>]+src="([^"]+)"/ )?.[ 1 ] || ''
	return imageUrl.replace( /&amp;/g, '&' )
}

/**
 * Create one parallax action set from the four preset action templates.
 *
 * @param {Array<Object>} actionTemplates Base z-index, scale, and move actions.
 * @param {number}        modifier        Depth multiplier for this layer.
 * @param {number}        scaleFactor     Configured scale strength.
 * @param {number}        moveFactor      Configured movement strength.
 *
 * @return {Array<Object>} Configured actions for one layer.
 */
const createParallaxActions = ( actionTemplates, modifier, scaleFactor, moveFactor ) => [
	{
		...actionTemplates[ 0 ],
		value: { property: 'z-index', value: modifier },
	},
	{
		...actionTemplates[ 1 ],
		value: {
			x: 1 + ( modifier * scaleFactor * 0.05 ),
			y: 1 + ( modifier * scaleFactor * 0.05 ),
		},
	},
	{
		...actionTemplates[ 2 ],
		value: {
			x: '', y: -modifier * moveFactor, z: '',
		},
	},
	{
		...actionTemplates[ 3 ],
		value: {
			x: '', y: modifier * moveFactor, z: '',
		},
	},
]

/**
 * Configure Elementor's generated image layers and their path-based targets.
 *
 * @param {Object} selectedPreset   Preset being configured.
 * @param {Object} optionValues     Values selected in the configuration modal.
 * @param {Object} interactionSetup Mutable interaction setup.
 *
 * @return {boolean} Whether the shared insertion flow should continue.
 */
const configureElementorParallax = ( selectedPreset, optionValues, interactionSetup ) => {
	const {
		count = 3, scaleFactor = 5, moveFactor = 50,
	} = optionValues
	const sourceBlocks = selectedPreset.serializedChildrenBlocks.slice( 0, count )
	const modifiers = shuffleArray( Array.from( { length: sourceBlocks.length }, ( _, i ) => i + 1 ) )
	const actionTemplates = interactionSetup.timelines[ 0 ].actions.slice( 0, 4 )
	const targetRefs = {
		parallaxRoot: {
			elementor: { path: [ 0 ] },
		},
	}
	const targetMappings = [
		{
			targetRef: 'parallaxRoot',
			interactionPath: [ 'target' ],
		},
	]

	selectedPreset.elementorExample = [
		{
			id: 'interact-parallax',
			elType: 'container',
			settings: {
				content_width: 'full',
				flex_direction: 'row',
			},
			elements: sourceBlocks.map( ( serializedBlock, index ) => ( {
				id: `interact-parallax-layer-${ index + 1 }`,
				elType: 'container',
				settings: {
					content_width: 'full',
				},
				elements: [
					{
						id: `interact-parallax-image-${ index + 1 }`,
						elType: 'widget',
						widgetType: 'image',
						settings: {
							image: {
								id: '',
								url: getImageUrl( serializedBlock ),
								source: 'url',
								size: '',
							},
							image_size: 'full',
							caption_source: 'none',
							link_to: 'none',
						},
					},
				],
			} ) ),
		},
	]

	interactionSetup.timelines[ 0 ].actions = sourceBlocks.flatMap( ( _, index ) => {
		const modifier = modifiers[ index ]
		const actionOffset = index * actionTemplates.length
		const layerRef = `parallaxLayer${ index + 1 }`
		const imageRef = `parallaxImage${ index + 1 }`

		targetRefs[ layerRef ] = {
			elementor: { path: [ 0, 'elements', index ] },
		}
		targetRefs[ imageRef ] = {
			elementor: { path: [ 0, 'elements', index, 'elements', 0 ] },
		}
		targetMappings.push(
			{
				targetRef: layerRef,
				interactionPath: [ 'timelines', 0, 'actions', actionOffset, 'target' ],
			},
			{
				targetRef: imageRef,
				interactionPath: [ 'timelines', 0, 'actions', actionOffset + 1, 'target' ],
			},
			{
				targetRef: layerRef,
				interactionPath: [ 'timelines', 0, 'actions', actionOffset + 2, 'target' ],
			},
			{
				targetRef: layerRef,
				interactionPath: [ 'timelines', 0, 'actions', actionOffset + 3, 'target' ],
			}
		)

		return createParallaxActions( actionTemplates, modifier, scaleFactor, moveFactor )
	} )

	selectedPreset.targetRefs = targetRefs
	selectedPreset.targetMappings = targetMappings

	return true
}

const parallax = ( selectedPreset, optionValues, interactionSetup, mode = 'insert' ) => {
	if ( isElementorEditor() ) {
		if ( mode === 'apply' ) {
			const {
				scaleFactor = 5, moveFactor = 50,
			} = optionValues
			const actions = interactionSetup.timelines[ 0 ].actions.slice( 0, 4 )
			interactionSetup.timelines[ 0 ].actions = createParallaxActions(
				actions,
				1,
				scaleFactor,
				moveFactor
			).map( action => ( {
				...action,
				target: { type: 'trigger' },
			} ) )
			selectedPreset.targetMappings = []
			selectedPreset.targetRefs = {}

			return true
		}

		return configureElementorParallax( selectedPreset, optionValues, interactionSetup )
	}

	const {
		count = 3, scaleFactor = 5, moveFactor = 50,
	} = optionValues
	const randomModifiers = shuffleArray( Array.from( { length: count }, ( _, i ) => i + 1 ) )
	const children = selectedPreset.serializedChildrenBlocks.slice( 0, count )
	const [ columns ] = parse( selectedPreset.serializedParentBlock )
	columns.innerBlocks = children.map( child => parse( child )[ 0 ] )

	dispatch( 'core/block-editor' ).insertBlocks( columns )

	const targetObj = createTargetObj( columns )
	interactionSetup.target = targetObj

	const actions = interactionSetup.timelines[ 0 ].actions
	const zIndexAction = actions[ 0 ]
	const scaleAction = actions[ 1 ]
	const initialMoveAction = actions[ 2 ]
	const finalMoveAction = actions[ 3 ]

	const newActions = columns.innerBlocks.map( ( column, index ) => {
		const modifier = randomModifiers[ index ]
		const columnTargetObj = createTargetObj( column )
		const imageTargetObj = createTargetObj( column.innerBlocks[ 0 ] )

		const newZIndexAction = {
			...zIndexAction,
			target: columnTargetObj,
			value: {
				property: 'z-index',
				value: modifier,
			},
		}

		const newScaleAction = {
			...scaleAction,
			target: imageTargetObj,
			value: {
				x: 1 + ( modifier * scaleFactor * 0.05 ),
				y: 1 + ( modifier * scaleFactor * 0.05 ),
			},
		}

		const newInitialMoveAction = {
			...initialMoveAction,
			target: columnTargetObj,
			 value: {
				x: '',
				y: -modifier * moveFactor,
				z: '',
			},
		}

		const newFinalMoveAction = {
			...finalMoveAction,
			target: columnTargetObj,
			 value: {
				x: '',
				y: modifier * moveFactor,
				z: '',
			},
		}

		return [ newZIndexAction, newScaleAction, newInitialMoveAction, newFinalMoveAction ]
	} )

	interactionSetup.timelines[ 0 ].actions = newActions.flat()

	return false
}

export default parallax
