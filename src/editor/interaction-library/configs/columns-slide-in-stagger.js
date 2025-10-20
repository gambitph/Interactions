
import { parse } from '@wordpress/blocks'
import { dispatch } from '@wordpress/data'
import { createTargetObj, setValueAtPath } from '.././util'

const columnsSlideInStagger = ( selectedPreset, optionValues, interactionSetup ) => {
	const children = selectedPreset.serializedChildrenBlocks.slice( 0, optionValues.count || 3 )
	const [ columns ] = parse( selectedPreset.serializedParentBlock )
	columns.innerBlocks = children.map( child => parse( child )[ 0 ] )

	dispatch( 'core/block-editor' ).insertBlocks( columns )

	const targetObj = createTargetObj( columns )
	interactionSetup.target = targetObj

	selectedPreset.configurableOptions.forEach( option => {
		const value = optionValues[ option.key ] ?? option.controls.default ?? ''
		if ( option.mappings ) {
			option.mappings.forEach( mapping => {
				setValueAtPath( interactionSetup, mapping.path, value )
			} )
		}
	} )

	return false
}

export default columnsSlideInStagger
