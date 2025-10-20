/**
 * This highlights a block when an interaction is mouseovered.
 */
import './store'
import { useSelect, dispatch } from '@wordpress/data'
import { useEffect } from '@wordpress/element'
import { addFilter } from '@wordpress/hooks'
import { createHigherOrderComponent } from '@wordpress/compose'

const withBlockSelect = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { selectMode, blockName } = useSelect( select => {
			if ( ! props.isSelected ) {
				return {}
			}

			// Only blocks with an anchor can be selected.
			const selectMode = select( 'interact/block-select' ).getSelectMode()
			return {
				selectMode,
				blockName: selectMode ? props.name : '',
			}
		}, [ props.name, props.isSelected ] )

		useEffect( () => {
			if ( selectMode ) {
				setTimeout( () => dispatch( 'interact/block-select' ).setSelectedClientId( props.clientId ) )
			} else {
				dispatch( 'interact/block-select' ).setSelectedClientId( null )
			}
		}, [ props.clientId, selectMode ] )

		if ( ! selectMode ) {
			return <BlockEdit { ...props } />
		}

		return (
			<>
				<BlockEdit { ...props } />
				<style>
					{
						`.editor-styles-wrapper [data-block="${ props.clientId }"] {
							outline: 1px solid #05f !important;
							outline-offset: 2px !important;
							transition: none !important;
						}
						.editor-styles-wrapper [data-block="${ props.clientId }"]:hover {
							outline: 1px solid #05f !important;
							outline-offset: 2px !important;
							transition: none !important;
						}
						.editor-styles-wrapper [data-block="${ props.clientId }"]::before {
							all: reset;
							content: "${ blockName }";
							position: absolute;
							top: 100%;
							transform: translateY(2px);
							left: -3px;
							color: #fff;
							background: #05f;
							padding: 4px 8px;
							font-size: 12px !important;
							z-index: 2;
							font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
							line-height: 1 !important;
							letter-spacing: normal !important;
							font-weight: normal !important;
							font-style: normal !important;
						}`
					}
				</style>
			</>
		)
	}
}, 'withBlockSelect' )

addFilter(
	'editor.BlockEdit',
	'interact/block-select',
	withBlockSelect
)
