import { customAlphabet } from 'nanoid'

const generateBricksElementId = customAlphabet( '1234567890abcdefghijklmnopqrstuvwxyz', 7 )

/**
 * Normalize a Bricks preset example into the flat element array shape Bricks
 * stores in post meta.
 *
 * Examples may already be flat arrays, but this also supports nested
 * `children` objects so presets can stay readable when needed.
 *
 * @param {Array|Object} example Raw Bricks example payload.
 *
 * @return {Array<Object>} Flat Bricks elements array.
 */
export const normalizeBricksExample = example => {
	const sourceElements = Array.isArray( example ) ? example : [ example ]
	const hasNestedChildren = sourceElements.some( element =>
		Array.isArray( element?.children ) &&
		element.children.some( child => child && typeof child === 'object' && ! Array.isArray( child ) )
	)

	if ( ! hasNestedChildren ) {
		return sourceElements
			.filter( Boolean )
			.map( element => ( {
				...structuredClone( element ),
				id: element.id || generateBricksElementId(),
				children: Array.isArray( element.children ) ? [ ...element.children ] : [],
			} ) )
	}

	const flattenedElements = []

	const visit = ( element, parentId = '' ) => {
		if ( ! element || typeof element !== 'object' ) {
			return null
		}

		const elementId = element.id || generateBricksElementId()
		const rawChildren = Array.isArray( element.children ) ? element.children : []
		const childObjects = rawChildren.filter( child => child && typeof child === 'object' && ! Array.isArray( child ) )
		const childIds = rawChildren.filter( child => typeof child === 'string' )
		const normalizedElement = structuredClone( element )

		normalizedElement.id = elementId
		normalizedElement.children = [ ...childIds ]

		if ( parentId ) {
			normalizedElement.parent = parentId
		} else {
			delete normalizedElement.parent
		}

		flattenedElements.push( normalizedElement )

		childObjects.forEach( child => {
			const childElementId = visit( child, elementId )
			if ( childElementId ) {
				normalizedElement.children.push( childElementId )
			}
		} )

		return elementId
	}

	sourceElements.forEach( element => visit( element ) )

	return flattenedElements
}

/**
 * Clone a Bricks preset example for insertion and regenerate every element ID.
 *
 * Returning the source-to-inserted ID map lets target refs keep referring to
 * stable preset IDs while the saved Bricks content uses fresh IDs each time.
 *
 * @param {Array|Object} example Raw Bricks example payload.
 *
 * @return {Object} Insert-ready elements and ID lookup data.
 */
export const cloneBricksExample = example => {
	const normalizedExample = normalizeBricksExample( example )
	const sourceIdToInsertedId = normalizedExample.reduce( ( accumulator, element ) => {
		accumulator[ element.id ] = generateBricksElementId()
		return accumulator
	}, {} )

	const elements = normalizedExample.map( element => ( {
		...structuredClone( element ),
		id: sourceIdToInsertedId[ element.id ],
		parent: element.parent ? sourceIdToInsertedId[ element.parent ] : '',
		children: Array.isArray( element.children )
			? element.children.map( childId => sourceIdToInsertedId[ childId ] || childId )
			: [],
	} ) )

	const rootElementIds = elements
		.filter( element => ! element.parent )
		.map( element => element.id )

	return {
		elements,
		rootElementIds,
		sourceIdToInsertedId,
	}
}
