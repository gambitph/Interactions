import { useEffect, useRef } from '@wordpress/element'
import { createHigherOrderComponent } from '@wordpress/compose'
import { addFilter } from '@wordpress/hooks'

// This object holds all the clientId-anchor pairs.
const ANCHORS = []
const CLIENT_IDS = []

// This attaches a listener to the editor to keep track of the block's anchor
// ALL the time.
const withTrackedAnchors = createHigherOrderComponent( BlockEdit => {
	return props => {
		const prevAnchorRef = useRef()

		useEffect( () => {
			const anchor = props.attributes?.anchor
			if ( ! anchor ) {
				return
			}

			// If this block had a previous anchor, remove it.
			if ( prevAnchorRef.current ) {
				const oldIndex = ANCHORS.indexOf( prevAnchorRef.current )
				if ( oldIndex !== -1 ) {
					ANCHORS.splice( oldIndex, 1 )
					CLIENT_IDS.splice( oldIndex, 1 )
				}
			}

			// Remove any existing entry for this anchor.
			// This ensures no duplication when the blocks are re-rendered.
			const existingIndex = ANCHORS.indexOf( anchor )
			if ( existingIndex !== -1 ) {
				ANCHORS.splice( existingIndex, 1 )
				CLIENT_IDS.splice( existingIndex, 1 )
			}

			ANCHORS.push( anchor )
			CLIENT_IDS.push( props.clientId )

			// Store anchor for next render
			prevAnchorRef.current = anchor
		}, [ props.clientId, props.attributes?.anchor ] )

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
