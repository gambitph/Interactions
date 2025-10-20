import {
	register, createReduxStore, dispatch,
} from '@wordpress/data'
import { domReady } from '~interact/shared/dom-ready.js'
import apiFetch from '@wordpress/api-fetch'
import { __ } from '@wordpress/i18n'

// Mode can be 'insert' or 'apply'. Null (falsy) means the modal is closed.
const DEFAULT_STATE = {
	mode: null,
	target: null,
	favorites: [],
}

const STORE_ACTIONS = {
	setMode: mode => {
		return {
			type: 'SET_MODE',
			mode,
		}
	},
	setTarget: target => {
		return {
		   type: 'SET_TARGET',
		   target,
		}
	},
	setFavorites: favorites => {
		return {
			type: 'SET_FAVORITES',
			favorites,
		}
	},
}

const STORE_SELECTORS = {
	getMode: state => state.mode,
	interactionTarget: state => state.target,
	getFavorites: state => state.favorites,
}

const STORE_REDUCER = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_MODE': {
			return {
				...state,
				mode: action.mode,
			}
		}
		case 'SET_TARGET': {
			return {
				...state,
				target: action.target,
			}
		}
		case 'SET_FAVORITES': {
			// Thorttle the favorites to avoid unnecessary API calls.
			setTimeout( () => {
				apiFetch( {
					path: `/interact/v1/update_interactions_library_favorites`,
					method: 'POST',
					data: { favorites: action.favorites },
				} ).then( response => {
					if ( ! Array.isArray( response ) ) {
					// eslint-disable-next-line no-console
						console.error( __( 'Invalid response from API:', 'interactions' ), response )
					}
				} ).catch( error => {
				// eslint-disable-next-line no-console
					console.error( __( 'Error updating favorites:', 'interactions' ), error )
				} )
			}, 500 )
			return {
				...state,
				favorites: action.favorites,
			}
		}
		default: {
			return state
		}
	}
}

register(
	createReduxStore( 'interact/interaction-library-modal', {
		reducer: STORE_REDUCER,
		actions: STORE_ACTIONS,
		selectors: STORE_SELECTORS,
	} )
)

domReady( () => {
	// Fetch the initial favorites and set to the store to avoid unnecessary API calls
	// when reopening the modal.
	apiFetch( {
		path: `/interact/v1/get_interactions_library_favorites`,
		method: 'GET',
	} ).then( response => {
		if ( Array.isArray( response ) ) {
			dispatch( 'interact/interaction-library-modal' ).setFavorites( response )
		} else {
			// eslint-disable-next-line no-console
			console.error( __( 'Invalid response from API:', 'interactions' ), response )
		}
	} ).catch( error => {
		// eslint-disable-next-line no-console
		console.error( __( 'Error fetching favorites:', 'interactions' ), error )
	} )
} )
