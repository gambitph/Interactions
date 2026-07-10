/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	pageScrolling: {
		initTimeline: interaction => {
			const smoothness = interaction.getOption( 'smoothness', 200 )
			const animation = interaction.createTimelineInstance( 0, {} )

			const update = isFirstCall => {
				const winScroll = document.body.scrollTop || document.documentElement.scrollTop
				const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
				const scrolled = height ? winScroll / height : 0

				// Clamp between 0 and 1 (iOS overscroll can produce negative values).
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
