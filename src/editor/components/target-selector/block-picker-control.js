import { ComboboxControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'
import { useRef } from '@wordpress/element'
import { startCase } from 'lodash'

const BlockPickerControl = props => {
	const options = getBlockOptions()
	const containerRef = useRef()

	const handleMouseDown = e => {
		if ( containerRef.current?.contains( e.target ) ) {
			e.stopPropagation()
		}
	}

	const renderItem = ( {
		item,
	} ) => {
		return (
			<div className="interact-block-picker-item">
				<div className="interact-block-picker-item-title">
					{ `${ item.group } › ${ item.title }` }
				</div>
				<div className="interact-block-picker-item-value" >
					{ item.value }
				</div>
			</div>
		)
	}

	return (
		<div
			ref={ containerRef }
			onMouseDown={ handleMouseDown }
			role="presentation"
		>
			<ComboboxControl
				className="interact-block-picker-control"
				label={ __( 'Block', 'interactions' ) }
				options={ options }
				__experimentalRenderItem={ renderItem }
				{ ...props }
			/>
		</div>
	)
}

let _blockOptions = null
const getBlockOptions = () => {
	if ( _blockOptions ) {
		return _blockOptions
	}

	const blocks = wp.blocks.getBlockTypes()
	const groups = blocks.reduce( ( groups, block ) => {
		// Only do this if block has support for `className`
		// By default all blocks support it.
		if ( block.supports?.className !== false ) {
			const categoryName = startCase( block.category ) || __( 'Uncategorized', 'interactions' )
			if ( ! groups[ categoryName ] ) {
				groups[ categoryName ] = []
			}
			groups[ categoryName ].push( {
				group: categoryName,
				title: block.title,
				label: `${ block.title } (${ block.name })`,
				value: block.name,
			} )
		}
		return groups
	}, {} )

	// Sort each group alphabetically
	Object.keys( groups ).forEach( key => {
		groups[ key ] = groups[ key ].sort( ( a, b ) => {
			if ( a.label < b.label ) {
				return -1
			}
			if ( a.label > b.label ) {
				return 1
			}
			return 0
		} )
	} )

	const flatOptions = Object.values( groups ).flat()

	_blockOptions = flatOptions
	return flatOptions
}

export const getFirstBlockOption = () => {
	return Object.values( getBlockOptions() )[ 0 ]?.[ 0 ]?.value || 'core/button'
}

export default BlockPickerControl
