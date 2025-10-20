
import { parse } from '@wordpress/blocks'
import { dispatch } from '@wordpress/data'
import { createTargetObj, setValueAtPath } from '.././util'

const columnsFadeInStagger = ( selectedPreset, optionValues, interactionSetup ) => {
	const {
		count = 3, interval = 0.3, duration = 1,
	} = optionValues
	const children = selectedPreset.serializedChildrenBlocks.slice( 0, count )
	const [ columns ] = parse( selectedPreset.serializedParentBlock )
	columns.innerBlocks = children.map( child => parse( child )[ 0 ] )

	dispatch( 'core/block-editor' ).insertBlocks( columns )

	const targetObj = createTargetObj( columns )
	interactionSetup.target = targetObj

	const intervalPath = selectedPreset.configurableOptions[ 1 ].mappings[ 0 ].path
	const durationPath = selectedPreset.configurableOptions[ 2 ].mappings[ 0 ].path

	setValueAtPath( interactionSetup, intervalPath, interval )
	setValueAtPath( interactionSetup, durationPath, duration )

	return false
}

export default columnsFadeInStagger
