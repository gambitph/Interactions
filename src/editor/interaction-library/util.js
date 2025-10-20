import { getOrGenerateBlockAnchor } from '~interact/editor/util'
import { useState, useEffect } from '@wordpress/element'

/**
 * Sets a value at a specified path in an object.
 *
 * @param {Object}        obj   - The object to modify.
 * @param {Array<string>} path  - The path to the property to set.
 * @param {*}             value - The value to set at the specified path.
 */
export const setValueAtPath = ( obj, path, value ) => {
	const lastKey = path[ path.length - 1 ]
	const target = path.slice( 0, -1 ).reduce( ( acc, key ) => acc?.[ key ], obj )
	if ( target && lastKey !== undefined ) {
		target[ lastKey ] = value
	}
}

/**
 * Get the value at a specified path in an object.
 *
 * @param {Object}        obj  - The object to modify.
 * @param {Array<string>} path - The path to the property to set.
 *
 * @return {*} The value to get at the specified path.
 */

export const getValueAtPath = ( obj, path ) => {
	if ( Array.isArray( path ) && path.length === 0 ) {
		return obj
	}
	const lastKey = path[ path.length - 1 ]
	const target = path.slice( 0, -1 ).reduce( ( acc, key ) => acc?.[ key ], obj )
	return target[ lastKey ]
}

// Appends newPresets into preset, but only if the id is not already in the preset.
const pushUniqueId = ( preset, newPresets ) => {
	const existingIds = new Map( preset.map( p => [ p.id, p ] ) )
	newPresets.forEach( np => {
		const existing = existingIds.get( np.id )
		// If not found, or if found and has non-empty interactionSetup, replace
		if ( ! existing ) {
			preset.push( np )
		} else if ( ! existing.interactionSetup ) {
			const idx = preset.findIndex( p => p.id === np.id )
			if ( idx !== -1 ) {
				preset[ idx ] = np
			}
		}
	} )
}

/**
 * React hook to lazy load interaction presets (free and premium).
 * Triggers rerender when presets are loaded or updated.
 *
 * @return {Array<Object>} The loaded interaction presets.
 */
export const useInteractionPresets = () => {
	const [ presets, setPresets ] = useState( [] )
	const [ isLoading, setIsLoading ] = useState( true )

	useEffect( () => {
		let isMounted = true

		const loadPresets = async () => {
			setIsLoading( true )
			const loadedPresets = []

			// Load free library
			try {
				const freeLibrary = await import( /* webpackChunkName: "library" */ './library.js' )
				const freePresets = freeLibrary.loadInteractionPresets()
				pushUniqueId( loadedPresets, freePresets )
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn( 'Failed to load free interaction library:', error )
			}

			let rerendered = false
			if ( typeof wp !== 'undefined' && wp.hooks && wp.hooks.doAction ) {
				// Provide a callback for premium to push presets and trigger rerender
				wp.hooks.doAction( 'interact.interactionLibrary.presets', loadedPresets, newPresets => {
					// Premium called this callback, so rerender
					if ( isMounted ) {
						pushUniqueId( loadedPresets, newPresets )
						setPresets( [ ...loadedPresets ] )
						setIsLoading( false )
					}
					rerendered = true
				} )
			}

			// If no premium presets were added, set only the free presets
			if ( isMounted && ! rerendered ) {
				setPresets( [ ...loadedPresets ] )
				setIsLoading( false )
			}
		}

		loadPresets()

		return () => {
			isMounted = false
		}
	}, [] )

	return [ presets, isLoading ]
}

// Manually handle the loop of preview to add a delay
export const addLoopDelayToPreview = ( element, delay = 1000 ) => {
	const video = element.currentTarget
	setTimeout( () => {
		video.currentTime = 0
		video.play()
	}, delay )
}

// Utility to create a target object from a block.
export const createTargetObj = block => ( {
	type: 'block',
	blockName: block?.name ?? '',
	value: getOrGenerateBlockAnchor( block?.clientId ),
} )

// Utility to apply mappings
export const applyTargetMappings = ( interactionSetup, targetMappings, blockOrTarget, fallbackPath = [ 'target' ] ) => {
	// If target mappings are provided, dynamically create target for each.
	if ( Array.isArray( targetMappings ) && targetMappings.length > 0 ) {
		targetMappings.forEach( ( { blockPath, interactionPath } ) => {
			// If it has clientId, then it's a block, and we have to create the target object
			const target = blockOrTarget?.clientId
				? createTargetObj( getValueAtPath( blockOrTarget, blockPath ) )
				: blockOrTarget
			setValueAtPath( interactionSetup, interactionPath, target )
		} )
	} else {
		setValueAtPath(
			interactionSetup,
			fallbackPath,
			blockOrTarget?.clientId ? createTargetObj( blockOrTarget ) : blockOrTarget
		)
	}
}

// Shuffle an array using Fisher–Yates algorithm
export const shuffleArray = input => {
	const array = [ ...input ]
	let currentIndex = array.length

	while ( currentIndex !== 0 ) {
		const randomIndex = Math.floor( Math.random() * currentIndex )
		currentIndex--;

		[ array[ currentIndex ], array[ randomIndex ] ] = [
			array[ randomIndex ], array[ currentIndex ] ]
	}
	return array
}

export const isPresetApplicable = ( preset, blockName ) => {
	const whitelist = preset.applyWhitelist
	const blacklist = preset.applyBlacklist

	// If no whitelist or blacklist blocks are defined, just include the preset.
	if ( ! whitelist && ! blacklist ) {
		return true
	}

	let isApplicable = true

	// If whitelist is defined, include the preset if the block
	// name matches any of the whitelist regexes.
	if ( whitelist && Array.isArray( whitelist ) ) {
		isApplicable = whitelist
			.some( regex => new RegExp( regex, 'i' )
				.test( blockName ) )
	}

	// If the preset passed the whitelist and blacklist is defined, exclude the preset if the block
	// name matches any of the blacklist regexes.
	if ( isApplicable && blacklist && Array.isArray( blacklist ) ) {
		isApplicable = ! blacklist
			.some( regex => new RegExp( regex, 'i' )
				.test( blockName ) )
	}

	return isApplicable
}
