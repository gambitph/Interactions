import { __ } from '@wordpress/i18n'
import { createInterpolateElement } from '@wordpress/element'
import { select, dispatch } from '@wordpress/data'

export const sidebar = {
	steps: [
		{
			title: __( 'Inspector Panel', 'interactions' ),
			description: __( 'You can create your own interaction in the inspector or further adjust the interaction inserted from the library.', 'interactions' ),
			help: __( 'Explore the inspector settings to see how it works.', 'interactions' ),
			anchor: '.interact-interaction-card',
			position: 'left',
			glowTarget: '.interact-sidebar',
		},
		{
			title: __( 'Previewing Interaction', 'interactions' ),
			description: __( 'Once you’re satisfied, preview your page to see interactions in action. Remember, you can always come back and edit later.', 'interactions' ),
			help: createInterpolateElement( __( 'Click <strong>Preview</strong> to view the result, then save your changes.', 'interactions' ), {
				strong: <strong />,
			} ),
			size: 'medium',
			anchor: '.interact-timeline__preview-button',
			position: 'left',
			nextEventTarget: '.interact-timeline__preview-button',
			glowTarget: '.interact-timeline__preview-button',
			preStep: () => {
				// Scroll to the preview button before moving to the next step.
				document.querySelector( '.interact-timeline__preview-button' )?.scrollIntoView( {
					behavior: 'smooth',
					block: 'center',
				} )
			},
		},
		{
			title: __( 'Apply to Existing Elements', 'interactions' ),
			description: __( 'Interactions aren’t limited to new content. You can also add animations to elements you’ve already created.', 'interactions' ),
			help: createInterpolateElement( __( 'Select an existing block and click the <strong>Interactions logo</strong> to open the library.', 'interactions' ), {
				strong: <strong />,
			} ),
			size: 'medium',
			anchor: '.interact-block-toolbar-button',
			position: 'bottom',
			nextEventTarget: '.interact-block-toolbar-button',
			glowTarget: '.interact-block-toolbar-button',
			preStep: () => {
				// Select the last block in the editor
				const blocks = select( 'core/block-editor' ).getBlocks()

				// Recursively find the last innermost block
				const getLastInnermostBlock = block => {
					if ( block.innerBlocks && block.innerBlocks.length ) {
						return getLastInnermostBlock( block.innerBlocks[ block.innerBlocks.length - 1 ] )
					}
					return block
				}

				if ( blocks.length ) {
					const lastBlock = blocks[ blocks.length - 1 ]
					const innermostBlock = getLastInnermostBlock( lastBlock )
					dispatch( 'core/block-editor' ).selectBlock( innermostBlock.clientId )
				}
			},
		},
	],
}
