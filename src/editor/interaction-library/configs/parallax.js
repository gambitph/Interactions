
import { parse } from '@wordpress/blocks'
import { dispatch } from '@wordpress/data'
import { createTargetObj, shuffleArray } from '.././util'

const parallax = ( selectedPreset, optionValues, interactionSetup ) => {
	const {
		count = 3, scaleFactor = 5, moveFactor = 50,
	} = optionValues
	const randomModifiers = shuffleArray( Array.from( { length: count }, ( _, i ) => i + 1 ) )
	const children = selectedPreset.serializedChildrenBlocks.slice( 0, count )
	const [ columns ] = parse( selectedPreset.serializedParentBlock )
	columns.innerBlocks = children.map( child => parse( child )[ 0 ] )

	dispatch( 'core/block-editor' ).insertBlocks( columns )

	const targetObj = createTargetObj( columns )
	interactionSetup.target = targetObj

	const actions = interactionSetup.timelines[ 0 ].actions
	const zIndexAction = actions[ 0 ]
	const scaleAction = actions[ 1 ]
	const initialMoveAction = actions[ 2 ]
	const finalMoveAction = actions[ 3 ]

	const newActions = columns.innerBlocks.map( ( column, index ) => {
		const modifier = randomModifiers[ index ]
		const columnTargetObj = createTargetObj( column )
		const imageTargetObj = createTargetObj( column.innerBlocks[ 0 ] )

		const newZIndexAction = {
			...zIndexAction,
			target: columnTargetObj,
			value: {
				property: 'z-index',
				value: modifier,
			},
		}

		const newScaleAction = {
			...scaleAction,
			target: imageTargetObj,
			value: {
				x: 1 + ( modifier * scaleFactor * 0.05 ),
				y: 1 + ( modifier * scaleFactor * 0.05 ),
			},
		}

		const newInitialMoveAction = {
			...initialMoveAction,
			target: columnTargetObj,
			 value: {
				x: '',
				y: -modifier * moveFactor,
				z: '',
			},
		}

		const newFinalMoveAction = {
			...finalMoveAction,
			target: columnTargetObj,
			 value: {
				x: '',
				y: modifier * moveFactor,
				z: '',
			},
		}

		return [ newZIndexAction, newScaleAction, newInitialMoveAction, newFinalMoveAction ]
	} )

	interactionSetup.timelines[ 0 ].actions = newActions.flat()

	return false
}

export default parallax
