import { useEffect } from '@wordpress/element'
import { createHigherOrderComponent } from '@wordpress/compose'
import { addFilter } from '@wordpress/hooks'

// This object holds all the clientId-anchor pairs.
const ANCHORS = []
const CLIENT_IDS = []

// This attaches a listener to the editor to keep track of the block's anchor
// ALL the time.
const withTrackedAnchors = createHigherOrderComponent( BlockEdit => {
	return props => {
		useEffect( () => {
			if ( props.attributes.anchor ) {
				// Remove any previous anchor selector for this clientId.
				const index = CLIENT_IDS.indexOf( props.clientId )
				if ( index !== -1 ) {
					CLIENT_IDS.splice( index, 1 )
					ANCHORS.splice( index, 1 )
				}
				// Keep track of the clientId-anchor pair
				CLIENT_IDS.push( props.clientId )
				ANCHORS.push( props.attributes.anchor )
			}
		}, [
			props.clientId,
			props.attributes?.anchor,
		] )

		return <BlockEdit { ...props } />
	}
}, 'withTrackedAnchors' )

addFilter(
	'editor.BlockEdit',
	'interact/track-anchors',
	withTrackedAnchors
)

export const deleteBlockAnchor = clientId => {
	const index = CLIENT_IDS.indexOf( clientId )
	if ( index !== -1 ) {
		CLIENT_IDS.splice( index, 1 )
		ANCHORS.splice( index, 1 )
	}
}

export const getBlockAnchor = clientId => {
	const index = CLIENT_IDS.indexOf( clientId )
	return index !== -1 ? ANCHORS[ index ] : null
}

export const getBlockClientId = blockAnchor => {
	const index = ANCHORS.indexOf( blockAnchor )
	return index !== -1 ? CLIENT_IDS[ index ] : null
}

export const addClientIdAnchorPair = ( clientId, anchor ) => {
	CLIENT_IDS.push( clientId )
	ANCHORS.push( anchor )
}
