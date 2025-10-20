/**
 * This highlights a block when an interaction is mouseovered.
 */
import { useSelect } from '@wordpress/data'
import { useEffect, useState } from '@wordpress/element'
import { addFilter } from '@wordpress/hooks'
import { createHigherOrderComponent } from '@wordpress/compose'
import { __ } from '@wordpress/i18n'

const withBlockHighlight = createHigherOrderComponent( BlockEdit => {
	return props => {
		const [ isHighlighted, setIsHighlighted ] = useState( false )

		// If an interaction is highlighted, set the current block to be
		// highlighted is it has the same anchor.
		useEffect( () => {
			const highlightHandler = ev => {
				if ( !! props.attributes.anchor && ev.detail.anchor === props.attributes.anchor ) {
					setIsHighlighted( true )
				} else {
					setIsHighlighted( false )
				}
			}

			window?.addEventListener( 'interact/highlight-block', highlightHandler )
			return () => {
				window?.removeEventListener( 'interact/highlight-block', highlightHandler )
				setIsHighlighted( false )
			}
		}, [ props.attributes.anchor ] )

		const blockLabel = useSelect( select => {
			return isHighlighted ? select( 'core/blocks' ).getBlockType( props.name ).title : ''
		}, [ props.name, isHighlighted ] )

		if ( ! isHighlighted ) {
			return <BlockEdit { ...props } />
		}

		return (
			<>
				<BlockEdit { ...props } />
				<style>
					{
						`.editor-styles-wrapper [data-block="${ props.clientId }"] {
							outline: 1px solid #05f;
							outline-offset: 2px;
						}
						.editor-styles-wrapper [data-block="${ props.clientId }"]::before {
							all: reset;
							content: "${ blockLabel.replace( /"/g, '\\"' ) }";
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
}, 'withBlockHighlight' )

addFilter(
	'editor.BlockEdit',
	'interact/block-highlight',
	withBlockHighlight
)
