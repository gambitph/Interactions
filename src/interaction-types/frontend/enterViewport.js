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
			const visibleHeight = Math.min( window.innerHeight, rect.height )
			const maxThreshold = ( visibleHeight / rect.height ) - 0.01
			const threshold = parseFloat( interaction.getOption( 'threshold', 0.3 ) )
			const normalizedThreshold = Math.min( Math.max( threshold, 0 ), maxThreshold )

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

			const io = new IntersectionObserver( callback, { threshold: normalizedThreshold } ) // eslint-disable-line compat/compat
			io.observe( trigger )

			return () => {
				timeline?.destroy()
				io.disconnect()
			}
		},
	},
} )
