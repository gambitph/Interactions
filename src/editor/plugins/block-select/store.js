import { register, createReduxStore } from '@wordpress/data'
import { __ } from '@wordpress/i18n'

const DEFAULT_STATE = {
	selectMode: false,
	selectedClientId: null,
}

const STORE_ACTIONS = {
	setSelectMode: mode => { // arg can be a function
		return {
			type: 'SET_MODE',
			selectMode: mode,
		}
	},
	setSelectedClientId: clientId => {
		return {
			type: 'SET_SELECTED_CLIENT_ID',
			selectedClientId: clientId,
		}
	},
}

const STORE_SELECTORS = {
	getSelectMode: state => state.selectMode,
	getSelectedClientId: state => state.selectedClientId,
}

const STORE_REDUCER = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_MODE': {
			// Hide the block contextual toolbar when in select mode because it
			// gets in the way.
			if ( action.selectMode ) {
				document?.body?.classList?.add( 'interact-block-select-mode' )
			} else {
				document?.body?.classList?.remove( 'interact-block-select-mode' )
			}
			return {
				...state,
				selectMode: action.selectMode,
			}
		}
		case 'SET_SELECTED_CLIENT_ID': {
			return {
				...state,
				selectedClientId: action.selectedClientId,
			}
		}
		default: {
			return state
		}
	}
}

register( createReduxStore( 'interact/block-select', {
	reducer: STORE_REDUCER,
	actions: STORE_ACTIONS,
	selectors: STORE_SELECTORS,
} ) )
