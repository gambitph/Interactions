import { actions as actionsConfig, interactions as interactionsConfig } from 'interactions'
import { customAlphabet } from 'nanoid'
import {
	range, startCase, cloneDeep,
} from 'lodash'
import { select, dispatch } from '@wordpress/data'
import { sprintf, __ } from '@wordpress/i18n'
import { addClientIdAnchorPair } from '../components/timeline/with-tracked-anchors'

const getUniqueTitle = title => {
	const interactions = select( 'interact/interactions' ).getInteractions()
	let matches = 1
	let safety = 0
	let newTitle = title
	while ( safety < 100 ) {
		safety++
		const hasMatch = interactions.some( interaction => {
			if ( interaction.title === newTitle ) {
				newTitle = title + ` (${ ++matches })`
				return true
			}
			return false
		} )
		if ( ! hasMatch ) {
			break
		}
	}
	return newTitle
}

// Look for the anchor in the blocks.
const getBlockNameFromAnchor = anchor => {
	let found = null
	const getBlocks = blocks => {
		if ( found ) {
			return
		}
		blocks.some( block => {
			if ( block.attributes.anchor === anchor ) {
				found = block.name
				return true
			}
			if ( block.innerBlocks.length ) {
				getBlocks( block.innerBlocks )
			}
			return false
		} )
	}
	getBlocks( select( 'core/block-editor' ).getBlocks() )
	return found
}

// Returns the current page
export const getLocationForCurrentPage = () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType()
	let locationParam = currentPostType === 'page' ? 'page'
		: currentPostType === 'wp_template' ? 'wp_template' // Site editor templates
			: !! currentPostType ? 'post'
				: null
	let locationValue = select( 'core/editor' ).getCurrentPostId()

	if ( ! locationParam ) {
		locationParam = 'all'
		locationValue = ''
	}
	return {
		param: locationParam,
		operator: '==',
		value: locationValue,
	}
}

export const createNewInteraction = ( interactionType, target = null, props = {} ) => {
	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	const interactionConfig = interactionsConfig[ interactionType ]

	if ( ! interactionConfig ) {
		if ( interactionType ) {
			throw new Error( `Error: Invalid interaction type "${ interactionType }".` )
		} else {
			throw new Error( `Error: Missing interaction type.` )
		}
	}

	let title = interactionConfig.name
	if ( target?.type === 'block' && target?.value !== '' ) {
		const blockType = getBlockNameFromAnchor( target.value )
		if ( blockType ) {
			const blockName = select( 'core/blocks' ).getBlockType( blockType ).title
			// Translators: First %s is the block name, second %s is the interaction type name.
			title = sprintf( __( '%s %s', 'interactions' ), blockName, interactionConfig.name )
		}
	}

	return {
		key: `interaction_${ nanoid( 10 ) }`,
		title: getUniqueTitle( startCase( title ) ),
		active: true,
		type: interactionType,
		target: target ?? {
			type: 'block',
			value: '',
		},
		timelines: props.timelines ?? range( interactionConfig.timelines.length ).map( () => ( {
			loop: false,
			onceOnly: false,
			alternate: false,
			reset: false,
			reverse: false,
			actions: [],
		} ) ),
		options: props.options ?? {},
		locations: [
			[ { ...getLocationForCurrentPage() } ],
		],
	}
}

export const ensureInteractionDefaults = interaction => {
	if ( ! ( interaction.type in interactionsConfig ) ) {
		const error = new Error( `Cannot load interaction "${ interaction.title }", missing interaction type "${ interaction.type }"` )
		error.interaction = interaction
		throw error
	}

	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	const interactionConfig = interactionsConfig[ interaction.type || 'click' ]

	return {
		key: `interaction_${ nanoid( 10 ) }`,
		title: __( 'Interaction', 'interactions' ),
		active: true,
		type: 'click',
		target: {
			type: 'block',
			value: '',
		},
		timelines: range( interactionConfig.timelines.length ).map( () => ( {
			loop: false,
			onceOnly: false,
			alternate: false,
			reset: false,
			reverse: false,
			actions: [],
		} ) ),
		options: {},
		locations: [
			[ { ...getLocationForCurrentPage() } ],
		],
		...interaction,
	}
}

export const duplicateInteraction = ( interaction, args = {} ) => {
	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	const newInteraction = cloneDeep( interaction )
	return {
		...newInteraction,
		key: `interaction_${ nanoid( 10 ) }`,
		title: getUniqueTitle( interaction.title ),
		...args,
	}
}

/**
 * Changes the type of an action into another, carries over the values from the
 * old action type and adds the default values of the new action type.
 *
 * @param {Object} action        Action object
 * @param {string} newActionType The new type of action
 * @return {Object} The action object with the new action type
 */
export const changeActionType = ( action, newActionType ) => {
	const actionConfig = actionsConfig[ newActionType ]
	const defaultValues = Object.keys( actionConfig.properties ).reduce( ( values, propertyKey ) => {
		const property = actionConfig.properties[ propertyKey ]
		values[ propertyKey ] = property.default
		return values
	}, {} )

	// Add the default values if the existing action values do not have them.
	Object.keys( defaultValues ).forEach( key => {
		if ( typeof action.value[ key ] === 'undefined' ) {
			action.value[ key ] = defaultValues[ key ]
		}
	} )

	return {
		...action,
		type: newActionType,
	}
}

export const createNewAction = options => {
	const {
		actionType,
		start = 0,
		targetType = 'trigger',
		props = {},
	} = options

	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	const actionConfig = actionsConfig[ actionType ]

	if ( ! actionConfig ) {
		if ( actionType ) {
			throw new Error( `Error: Invalid action type "${ actionType }".` )
		} else {
			throw new Error( `Error: Missing action type.` )
		}
	}

	const defaultValues = Object.keys( actionConfig.properties ).reduce( ( values, propertyKey ) => {
		const property = actionConfig.properties[ propertyKey ]
		values[ propertyKey ] = property.default
		return values
	}, {} )
	const defaultEasing = actionConfig?.defaultEasing || 'outCirc'

	return {
		type: actionType,
		key: `action_${ nanoid( 10 ) }`,
		target: {
			type: targetType,
			value: props.target?.value ?? '',
			blockName: props.target?.blockName ?? '', // Just a label for the action, not used for anything, this is generated when the trigger is selected.
			options: props.target?.options ?? '',
		},
		timing: {
			isStartingState: props.timing?.isStartingState ?? false,
			start: props.timing?.start ?? start,
			duration: props.timing?.duration ?? 0.5,
			easing: props.timing?.easing ?? defaultEasing,
			customEasing: props.timing?.customEasing ?? '',
			stagger: props.timing?.stagger ?? 0,
		},
		value: props.value ?? defaultValues,
	}
}

export const duplicateAction = action => {
	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	const newAction = cloneDeep( action )
	return {
		...newAction,
		key: `action_${ nanoid( 10 ) }`,
	}
}

/**
 * Gets the block selector for the action type and block name. The selector is
 * the target to apply the specific action style to.
 * @param {string} anchor     The anchor
 * @param {string} actionType The action type
 * @param {string} clientId   Optional clientId
 * @return {string} The resulting block selector
 */
export const formBlockSelector = ( anchor, actionType, clientId = null ) => {
	const blockName = clientId ? select( 'core/block-editor' ).getBlock( clientId )?.name
		: getBlockNameFromAnchor( anchor )

	if ( ! blockName ) {
		return anchor
	}
	const selectorTemplate = actionsConfig[ actionType ]?.blockSelectors?.[ blockName ]
	return selectorTemplate ? sprintf( selectorTemplate, anchor ) : anchor
}

/**
 * Creates a unique anchor for a block.
 *
 * @param {string} blockName Block name, e.g. core/paragraph
 * @return {string} The generated anchor, e.g. interact-paragraph-abcdef
 */
export const createAnchor = blockName => {
	const shortBlockName = blockName.replace( /^(.*?)\//, '' ).replace( /[^\d\w]/g, '-' ).replace( /\-+/g, '-' ).toLowerCase()
	const nanoid = customAlphabet( '1234567890abcdef', 10 )
	return `interact-${ shortBlockName }-${ nanoid( 6 ) }`
}

// Keep all generated anchors here so that all calls to getOrGenerateBlockAnchor
// return the same anchor.
const cachedBlockAnchors = {}

/**
 * Gets the anchor id of a block. If the block does not have an anchor id yet,
 * it will generate one. Calling this multiple times will not generate different
 * anchors.
 *
 * @param {string}  clientId
 * @param {boolean} updateAttribute
 * @return {string} anchor id
 */
export const getOrGenerateBlockAnchor = ( clientId, updateAttribute = true ) => {
	if ( ! clientId ) {
		return ''
	}

	// If there is an anchor already, use it.
	const { attributes, name } = select( 'core/block-editor' ).getBlock( clientId )
	if ( attributes.anchor ) {
		return attributes.anchor
	}

	// Check if we have a cached anchor for this block.
	if ( cachedBlockAnchors[ clientId ] ) {
		const anchor = cachedBlockAnchors[ clientId ]
		if ( updateAttribute ) {
			dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { anchor } )
			dispatch( 'interact/interactions' ).setDidModifyPostContent( true ) // This will trigger a save post when the post is published.
			delete cachedBlockAnchors[ clientId ]
		}
		return anchor
	}

	// Else, generate a new anchor id.
	const anchor = createAnchor( name )

	if ( updateAttribute ) {
		dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { anchor } )
		dispatch( 'interact/interactions' ).setDidModifyPostContent( true ) // This will trigger a save post when the post is published.
	} else {
		cachedBlockAnchors[ clientId ] = anchor
	}

	// Update the tracked anchors.
	addClientIdAnchorPair( clientId, anchor )

	return anchor
}

/**
 * If there's a cached anchor for a block, set it as the block's anchor.
 *
 * @param {string} anchor A cached anchor id
 * @return {void}
 */
export const setBlockAnchorIfPossible = anchor => {
	Object.keys( cachedBlockAnchors ).some( clientId => {
		const cachedAnchor = cachedBlockAnchors[ clientId ]
		if ( cachedAnchor === anchor ) {
			dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { anchor } )
			dispatch( 'interact/interactions' ).setDidModifyPostContent( true ) // This will trigger a save post when the post is published.
			delete cachedBlockAnchors[ clientId ]
			return true
		}
		return false
	} )
}

/**
 * Gets the first class name of a block. If the block does not have a class yet,
 * it will generate one. Calling this multiple times will generate different
 * classes.
 *
 * @param {string}  clientId
 * @param {boolean} updateAttribute
 * @return {string} class name
 */
export const getOrGenerateBlockClass = ( clientId, updateAttribute = true ) => {
	if ( ! clientId ) {
		return ''
	}

	// If there is a class already, use the first one.
	const { attributes, name } = select( 'core/block-editor' ).getBlock( clientId )
	if ( attributes.className ) {
		const mainClassName = attributes.className?.split( ' ' )?.[ 0 ] || ''
		if ( mainClassName ) {
			return mainClassName
		}
	}

	// Else, generate a new class name.
	const className = createAnchor( name )

	if ( updateAttribute ) {
		dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { className } )
		dispatch( 'interact/interactions' ).setDidModifyPostContent( true ) // This will trigger a save post when the post is published.
	}

	return className
}

/**
 * Utility function to open the Interactions sidebar.
 *
 * @return {Object} Dispatch action object
 */
export const openInteractionsSidebar = () => {
	if ( dispatch( 'core/edit-post' ) ) {
		return dispatch( 'core/edit-post' ).openGeneralSidebar( 'interact-editor/sidebar' )
	}
	return dispatch( 'core/edit-site' ).openGeneralSidebar( 'interact-editor/sidebar' )
}
