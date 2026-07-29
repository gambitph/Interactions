/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableHorizontalScrollerScroll: {
		initAction: action => {
			action.initActionFunction( () => {
				const columnNumber = action.getValue( 'column_number' ) || 1

				action.getTargets().forEach( el => {
					// Do not proceed if the target is not a horizontal scroller
					if ( ! el.classList?.contains( 'wp-block-stackable-horizontal-scroller' ) ) {
						return
					}

					// Horizontal scroller operations are done to the inner block content
					const blockContent = el.querySelector( '.stk-block-content' )
					const child = blockContent?.children?.[ 0 ]
					const columnWidth = child.clienWidth ?? 300
					const scrollSnapAlign = window.getComputedStyle( child )?.scrollSnapAlign ?? 'none'

					let scrollAmount = 0
					if ( scrollSnapAlign === 'start' || scrollSnapAlign === 'none' ) {
						scrollAmount = columnWidth * ( columnNumber - 1 )
					} else if ( scrollSnapAlign === 'center' ) {
						scrollAmount = columnWidth * ( columnNumber - 1.5 )
					} else if ( scrollSnapAlign === 'end' ) {
						scrollAmount = columnWidth * ( columnNumber - 2 )
					}

					blockContent.scrollTo( {
						left: scrollAmount,
						behavior: 'smooth',
					} )
				} )
			} )
		},
	},
} )
