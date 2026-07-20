/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	elementScrolling: {
		initTimeline: interaction => {
			const smoothness = interaction.getOption( 'smoothness', 200 )
			const offset = parseFloat( interaction.getOption( 'offset', 0 ) )
			const animation = interaction.createTimelineInstance( 0, {} )
			const trigger = interaction.getCurrentTrigger()

			const update = isFirstCall => {
				const rect = trigger.getBoundingClientRect()
				const viewportHeight = window.innerHeight

				// Distance scrolled from the top of the viewport to the top of the element.
				// 0 when the top of the element offset is at the bottom of the screen.
				// 1 when the bottom of the element is at the top of the screen.
				// Positive offset means start counting earlier and finish later, expanding the bounds.
				// Negative offset means start counting later and finish sooner, contracting the bounds.
				const elementScroll = viewportHeight - rect.top + offset
				const totalScroll = viewportHeight + rect.height + ( offset * 2 )
				const scrolled = totalScroll ? elementScroll / totalScroll : 0

				// Clamp between 0 and 1
				const clampedScrolled = Math.max( 0, Math.min( 1, scrolled ) )
				animation.seekPercentage( clampedScrolled, isFirstCall === true ? 0 : smoothness )
			}

			// Coalesce scroll events into a single rAF so we only seek once per
			// frame. Firing anime.js on every scroll event janks slower Android
			// devices.
			let rafId = null
			const scrollHandler = () => {
				if ( rafId !== null ) {
					return
				}
				rafId = window.requestAnimationFrame( () => {
					rafId = null
					update( false )
				} )
			}

			// Passive so the listener never blocks scrolling on mobile.
			window.addEventListener( 'scroll', scrollHandler, { passive: true } )
			update( true )

			return () => {
				if ( rafId !== null ) {
					window.cancelAnimationFrame( rafId )
					rafId = null
				}
				animation.destroy()
				window.removeEventListener( 'scroll', scrollHandler, { passive: true } )
			}
		},
	},
} )
