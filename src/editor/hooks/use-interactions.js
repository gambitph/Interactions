import { pluginVersion, wpVersion } from 'interactions'
import { cloneDeep } from 'lodash'
import {
	register,
	createReduxStore,
	dispatch,
	useSelect,
} from '@wordpress/data'
import { domReady } from '~interact/shared/dom-ready.js'
import apiFetch from '@wordpress/api-fetch'
import { __ } from '@wordpress/i18n'
import { ensureInteractionDefaults } from '../util'

const DEFAULT_STATE = {
	interactions: [],
	loadingError: null,
	didModifyPostContent: false,
}

const STORE_ACTIONS = {
	setInteractions: interactions => { // arg can be a function
		// Make sure that the interaction is of the correct format.
		const adjustedInteractions = interactions
			.map( interaction => {
				try {
					return ensureInteractionDefaults( interaction )
				} catch ( error ) {
					console.error( error ) // eslint-disable-line no-console
					return null
				}
			} )
			.filter( interaction => !! interaction )

		return {
			type: 'SET_INTERACTIONS',
			interactions: adjustedInteractions,
		}
	},
	setLoadingError: error => {
		return {
			type: 'SET_LOADING_ERROR',
			error,
		}
	},
	setDidModifyPostContent: didModifyPostContent => {
		return {
			type: 'SET_DID_MODIFY_POST_CONTENT',
			didModifyPostContent,
		}
	},
}

const STORE_SELECTORS = {
	getInteractions: state => state.interactions,
	getLoadingError: state => state.loadingError,
	didModifyPostContent: state => state.didModifyPostContent,
}

const STORE_REDUCER = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_INTERACTIONS': {
			return {
				...state,
				interactions: action.interactions,
			}
		}
		case 'SET_LOADING_ERROR': {
			return {
				...state,
				loadingError: action.error,
			}
		}
		case 'SET_DID_MODIFY_POST_CONTENT': {
			return {
				...state,
				didModifyPostContent: action.didModifyPostContent,
			}
		}
		default: {
			return state
		}
	}
}

register( createReduxStore( 'interact/interactions', {
	reducer: STORE_REDUCER,
	actions: STORE_ACTIONS,
	selectors: STORE_SELECTORS,
} ) )

/**
 * Whether or not the interaction should be shown in the editor based on what's
 * currently beign edited in the Block Editor.
 *
 * @param {Array}  interaction
 * @param {Object} select      wp.data.select
 *
 * @return {boolean} Whether or not the interaction should be shown in the editor.
 */
export const isInteractionShown = ( interaction, select ) => {
	// If the editor is not available (e.g. in Widgets editor), don't do anything.
	if ( ! select( 'core/editor' ) ) {
		return false
	}
	return interaction.locations.some(	locationGroup => {
		return locationGroup.every( location => {
			const {
				param, operator, value,
			} = location

			switch ( param ) {
				case 'post':
				case 'page': {
					// If blank, then it's all posts/pages.
					if ( ! value || isNaN( +value ) ) {
						const postType = select( 'core/editor' ).getCurrentPostType()
						const postTypeParam = value || param
						return operator === '==' ? postType === postTypeParam : postType !== postTypeParam
					}
					const match = value.toString() === select( 'core/editor' ).getCurrentPostId()?.toString()
					return operator === '==' ? match : ! match
				}
				case 'post_type': {
					const match = value.toString() === select( 'core/editor' ).getCurrentPostType()?.toString()
					return operator === '==' ? match : ! match
				}
				case 'post_status':
				case 'post_format':
				case 'post_category':
				case 'post_taxonomy':
					return true
				case 'post_template':
				case 'page_template': {
					const match = value.toString() === select( 'core/editor' ).getCurrentPost()?.template.toString()
					return operator === '==' ? match : ! match
				}
				case 'post_parent':
				case 'page_parent': {
					const match = value.toString() === select( 'core/editor' ).getCurrentPost()?.parent.toString()
					return operator === '==' ? match : ! match
				}
				case 'all': // Entire website
					return true
				case 'wp_template': // Site editor templates: home, 404, etc
					const currentPostType = select( 'core/editor' ).getCurrentPostType()
					if ( currentPostType === 'wp_template' ) {
						const match = value.toString() === select( 'core/editor' ).getCurrentPostId()?.toString()
						return operator === '==' ? match : ! match
					}
					break
				case 'post_archive': {
					// TODO: [FSE-SUPPORT] this will most likely be called inside the site editor, we need to get whether this is an archive
					// TODO: [FSE-SUPPORT] Does the wp_template handle this already?
					return false
				}
				default:
					break
			}

			return false
		} )
	} )
}

const useInteractions = () => {
	const data = useSelect( select => {
		// This is a custom setter, mimics useState's setter, you can input a
		// function or the value.
		const setInteractions = interactions => {
			if ( typeof interactions === 'function' ) {
				const currentInteractions = select( 'interact/interactions' ).getInteractions()
				return dispatch( 'interact/interactions' ).setInteractions( interactions( currentInteractions ) )
			}
			return dispatch( 'interact/interactions' ).setInteractions( interactions )
		}

		const updateInteraction = newInteraction => {
			// Check if we updated any anchors/attributes, if we did, then we need to ask whether to also update the post.
			const didModifyPostContent = select( 'interact/interactions' ).didModifyPostContent()
			if ( didModifyPostContent ) {
				if ( confirm( __( 'Some block anchors have been updated for your interactions to work correctly. Do you want to save these post changes? (Any modified synced patterns will also be saved)', 'interactions' ) ) ) { // eslint-disable-line no-alert
					dispatch( 'interact/interactions' ).setDidModifyPostContent( false )
					// Save the post.
					dispatch( 'core/editor' ).savePost()

					// Get all the dirty reusable blocks and save them.
					try { // Wrap in try because experimental.
						select( 'core' ).__experimentalGetDirtyEntityRecords().forEach( record => {
							const { key: ref } = record
							dispatch( 'core' ).saveEditedEntityRecord( 'postType', 'wp_block', ref )
						} )
					} catch ( err ) {
						alert( __( 'Error saving synced patterns, please save manually', 'interactions' ) ) // eslint-disable-line no-alert
						console.error( 'Interactions saving reusable blocks error:', err ) // eslint-disable-line no-console
					}
				}
			}

			return apiFetch( {
				path: `/interact/v1/update_interaction`,
				method: 'POST',
				data: { data: JSON.stringify( newInteraction ) },
			} )
				.then( () => {
					let found = false
					let interactions = cloneDeep( select( 'interact/interactions' ).getInteractions() )

					// If the interaction is already in our list, update it.
					interactions = interactions.map( interaction => {
						if ( interaction.key === newInteraction.key ) {
							found = true
							return newInteraction
						}
						return interaction
					} )

					// If the interaction isn't yet in our list, add it.
					if ( ! found ) {
						interactions.push( newInteraction )
					}

					setInteractions( interactions )
				} )
				.catch( error => {
					console.error( 'Interactions saving error:', error ) // eslint-disable-line no-console
					alert( __( 'Error saving interaction, got this error:', 'interactions' ) + '\n' + error.message + '\n' + error.code ) // eslint-disable-line no-alert
				} )
		}

		const deleteInteraction = key => {
			return apiFetch( {
				path: `/interact/v1/delete_interaction`,
				method: 'POST',
				data: { key },
			} )
				.then( () => {
					const interactions = select( 'interact/interactions' ).getInteractions().filter( interaction => interaction.key !== key )
					setInteractions( interactions )
				} )
				.catch( error => {
					console.error( 'Interactions deleting error:', error ) // eslint-disable-line no-console
					alert( __( 'Error deleting interaction, got this error:', 'interactions' ) + '\n' + error.message + '\n' + error.code ) // eslint-disable-line no-alert
				} )
		}

		const interactions = select( 'interact/interactions' ).getInteractions()
		const interactionsFiltered = interactions.filter( interaction => isInteractionShown( interaction, select ) )

		return {
			interactions,
			interactionsFiltered,
			setInteractions,
			updateInteraction,
			deleteInteraction,
		}
	}, [] )

	return {
		loadingError: useSelect( select => select( 'interact/interactions' ).getLoadingError(), [] ),
		...data,
	}
}

domReady( () => {
	const logErrorDetails = ( message, locations = [], postContent = '' ) => {
		const validLocations = locations
			.flat()
			.filter( location => location.operator === '==' )
			.map( location => location.value )

		const locationsString = validLocations.includes( 'post' ) ? 'All posts' : validLocations.join( ',' )
		// eslint-disable-next-line no-console
		console.error(
			'Interactions loading error. If you need to contact support, you can copy this entire message and send to support:\n\n',
			message,
			'\nPlugin Version:', pluginVersion,
			'\nWordPress Version:', wpVersion,
			'\n\nPost Content:', postContent,
			locationsString ? `\n\nYou can remove the interaction that errored by deleting the post with the post ID: ${ locationsString }` : '',
		)
	}

	apiFetch( { path: '/interact/v1/get_interactions' } )
		.then( results => {
			dispatch( 'interact/interactions' ).setInteractions( results )
		} )
		.catch( error => {
			const key = error.interaction?.key
			const locations = error.interaction?.locations
			const errorMessage = error.message
			error.interactionKey = key

			if ( ! key ) {
				logErrorDetails( errorMessage )
				dispatch( 'interact/interactions' ).setLoadingError( error )
				return
			}

			apiFetch( {
				path: `/wp/v2/interact-interaction?slug=${ key }&context=edit`,
			} )
				.then( posts => {
					const postContent = posts?.[ 0 ]?.content?.raw || 'Unavailable'
					logErrorDetails( errorMessage, locations, postContent )
				} )
				.catch( () => {
					logErrorDetails( errorMessage, locations )
				} )
				.finally( () => {
					dispatch( 'interact/interactions' ).setLoadingError( error )
				} )
		} )
} )

export default useInteractions
