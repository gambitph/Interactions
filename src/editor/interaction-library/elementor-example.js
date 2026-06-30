const ELEMENTOR_META_KEYS = [ 'unit', 'sizes', 'isLinked' ]

/**
 * Remove empty values from copied Elementor settings while preserving
 * meaningful falsy values such as 0 and false.
 *
 * @param {*} value Raw copied Elementor value.
 *
 * @return {*} Pruned value, or undefined when empty.
 */
const pruneElementorValue = value => {
	if ( value === null || value === undefined || value === '' ) {
		return undefined
	}

	if ( Array.isArray( value ) ) {
		const prunedArray = value
			.map( item => pruneElementorValue( item ) )
			.filter( item => item !== undefined )

		return prunedArray.length > 0 ? prunedArray : undefined
	}

	if ( typeof value !== 'object' ) {
		return value
	}

	const prunedObject = Object.entries( value ).reduce( ( accumulator, [ key, nestedValue ] ) => {
		const prunedValue = pruneElementorValue( nestedValue )
		if ( prunedValue !== undefined ) {
			accumulator[ key ] = prunedValue
		}
		return accumulator
	}, {} )

	const keys = Object.keys( prunedObject )
	if ( keys.length === 0 ) {
		return undefined
	}

	// Drop Elementor control placeholders that only keep metadata such as
	// `unit`, `sizes`, or `isLinked` but no real configured value.
	const hasMeaningfulValue = keys.some( key => ! ELEMENTOR_META_KEYS.includes( key ) )
	if ( ! hasMeaningfulValue ) {
		return undefined
	}

	return prunedObject
}

/**
 * Normalize a single copied Elementor element into the minimal structure
 * needed by the paste command.
 *
 * @param {Object} element Raw Elementor element data.
 *
 * @return {?Object} Normalized Elementor element.
 */
const normalizeElementorNode = element => {
	if ( ! element || typeof element !== 'object' ) {
		return null
	}

	const normalizedChildren = Array.isArray( element.elements )
		? element.elements
			.map( child => normalizeElementorNode( child ) )
			.filter( Boolean )
		: []

	return pruneElementorValue( {
		id: element.id,
		elType: element.elType,
		widgetType: element.widgetType,
		isInner: element.isInner,
		settings: pruneElementorValue(
			element.settings && typeof element.settings === 'object'
				? { ...element.settings }
				: {}
		) || {},
		elements: normalizedChildren,
	} )
}

/**
 * Normalize copied Elementor editor JSON so presets can store raw copied
 * structures while the paste command receives a predictable array shape.
 *
 * @param {Array|Object} example Raw copied Elementor example data.
 *
 * @return {Array<Object>} Normalized Elementor example tree.
 */
export const normalizeElementorExample = example => {
	const elements = Array.isArray( example ) ? example : [ example ]

	return elements
		.map( element => normalizeElementorNode( element ) )
		.filter( Boolean )
}

/**
 * Convert copied Elementor editor JSON into a formatted string that can be
 * pasted directly into a preset's `elementorExample` entry.
 *
 * @param {Array|Object} example Raw copied Elementor example data.
 *
 * @return {string} Pretty-printed normalized JSON.
 */
export const serializeElementorExample = example => {
	return JSON.stringify( normalizeElementorExample( example ), null, 4 )
}

/**
 * Log the normalized Elementor example JSON for quick copy/paste while
 * creating library presets.
 *
 * @param {Array|Object} example Raw copied Elementor example data.
 *
 * @return {Array<Object>} Normalized Elementor example tree.
 */
export const logNormalizedElementorExample = example => {
	const normalized = normalizeElementorExample( example )

	// eslint-disable-next-line no-console
	console.log( JSON.stringify( normalized, null, 4 ) )

	return normalized
}
