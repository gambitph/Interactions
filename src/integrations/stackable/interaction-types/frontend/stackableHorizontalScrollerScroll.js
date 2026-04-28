/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */

InteractRunner.addInteractionConfig( {
	stackableHorizontalScrollerScroll: {
		initTimeline: interaction => {
			const column = interaction.getOption( 'column', '' )

			let timeline = null
			let isScrolling

			const handler = event => {
				const target = event.target
				const child = target.children[ 0 ]
				const length = target.children.length

				const columnWidth = child.clientWidth ?? 300
				const scrollSnapAlign = window.getComputedStyle( child )?.scrollSnapAlign ?? 'none'
				const maxScrollLeft = target.scrollWidth - target.clientWidth

				let currentColumns = []

				if ( target.scrollLeft === maxScrollLeft ) {
					const currentAmount = Math.floor( target.clientWidth / columnWidth )
					currentColumns = Array.from( { length: currentAmount }, ( _, i ) => length - currentAmount + i + 1 )
				} else if ( scrollSnapAlign === 'start' || scrollSnapAlign === 'none' ) {
					currentColumns = [ Math.floor( target.scrollLeft / columnWidth ) + 1 ]
				} else if ( scrollSnapAlign === 'center' ) {
					currentColumns = [ Math.floor( ( target.scrollLeft + ( ( target.clientWidth - columnWidth ) / 2 ) ) / columnWidth ) + 1 ]
				}

				clearTimeout( isScrolling )
				if ( column === '' || currentColumns.includes( Number( column ) ) ) {
					isScrolling = setTimeout( () => {
						timeline?.destroy( false )

						timeline = interaction.createTimelineInstance( 0 )
						timeline?.play()
					}, 100 )
				}
			}

			const el = interaction.getCurrentTrigger()

			// Do not proceed if the target is not a Stackable Tabs
			if ( el.classList?.contains( 'wp-block-stackable-horizontal-scroller' ) ) {
				// Horizontal scroller operations are done to the inner block content
				const blockContent = el.querySelector( '.stk-block-content' )

				blockContent.addEventListener( 'scroll', handler )

				return () => {
					timeline?.destroy()
					blockContent.removeEventListener( 'scroll', handler )
				}
			}
		},
	},
} )
