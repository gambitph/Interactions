/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	enterViewport: {
		initTimeline: interaction => {
			let timeline = null
			const trigger = interaction.getCurrentTrigger()

			// Normalize the threshold to be between 0 and the maximum possible threshold
			// for the current trigger. This ensures the interaction always works.
			const rect = trigger.getBoundingClientRect()
			const threshold = parseFloat( interaction.getOption( 'threshold', 0.3 ) )
			// Guard against a zero (or not-yet-laid-out) height. On slower
			// devices the element may not have its final height when we
			// initialize, which would make maxThreshold NaN and throw when
			// constructing the IntersectionObserver.
			let normalizedThreshold = Math.max( threshold, 0 )
			if ( rect.height > 0 ) {
				const visibleHeight = Math.min( window.innerHeight, rect.height )
				const maxThreshold = ( visibleHeight / rect.height ) - 0.01
				normalizedThreshold = Math.min( normalizedThreshold, maxThreshold )
			}
			normalizedThreshold = Math.max( normalizedThreshold, 0 )

			// Use Intersection Observer to detect when the target enters the viewport
			const callback = entries => {
				entries.forEach( entry => {
					const timelineIndex = entry.isIntersecting ? 0 : 1

					if ( interaction.timelines[ timelineIndex ].hasActions ) {
						timeline?.destroy( false )

						// Create and play the interaction timeline (index 0).
						timeline = interaction.createTimelineInstance( timelineIndex )
						timeline?.play()
					}
				} )
			}

			// Fire slightly before the element scrolls into view on Android only.
			// Android Chrome batches/defers IntersectionObserver callbacks during
			// momentum (fling) scrolling, so without this lead time reveals
			// "pop in" late compared to iOS Safari.
			const isAndroid = /Android/i.test( navigator.userAgent )
			const observerOptions = { threshold: normalizedThreshold }
			if ( isAndroid ) {
				observerOptions.rootMargin = '0px 0px 15% 0px'
			}

			const io = new IntersectionObserver( callback, observerOptions ) // eslint-disable-line compat/compat
			io.observe( trigger )

			return () => {
				timeline?.destroy()
				io.disconnect()
			}
		},
	},
} )
