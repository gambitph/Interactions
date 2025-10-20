/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	mouseHovering: {
		initTimeline: interaction => {
			const smoothness = interaction.getOption( 'smoothness', 200 )
			const resetToCenter = interaction.getOption( 'resetToCenter', true )
			const resetDelay = interaction.getOption( 'resetDelay', 1000 )
			const animationX = interaction.createTimelineInstance( 0, {} )
			const animationY = interaction.createTimelineInstance( 1, {} )

			const trigger = interaction.getCurrentTrigger()
			let resetTimeout = null

			const moveHandler = event => {
				if ( event.currentTarget !== trigger ) {
					return
				}

				clearTimeout( resetTimeout )

				// Get the bounding rectangle of trigger
				const rect = trigger.getBoundingClientRect()

				// Calculate the mouse position relative to the trigger
				const x = event.clientX - rect.left
				const y = event.clientY - rect.top

				// Compute the percentage of the mouse position inside the target from left to right 0-1
				const percentageX = x / rect.width
				const percentageY = y / rect.height

				animationX.seekPercentage( percentageX, smoothness )
				animationY.seekPercentage( percentageY, smoothness )
			}

			// Reset to center when mouse leaves
			const mouseLeaveHandler = event => {
				if ( ! resetToCenter || event.currentTarget !== trigger ) {
					return
				}

				clearTimeout( resetTimeout )

				resetTimeout = setTimeout( () => {
					// Hard coded return to center at 700ms
					animationX.seekPercentage( 0.5, 700 )
					animationY.seekPercentage( 0.5, 700 )
				}, resetDelay )
			}

			trigger.addEventListener( 'mousemove', moveHandler )
			trigger.addEventListener( 'mouseleave', mouseLeaveHandler )

			animationX.seekPercentage( 0.5 )
			animationY.seekPercentage( 0.5 )

			return () => {
				animationX?.destroy()
				animationY?.destroy()
				trigger.removeEventListener( 'mousemove', moveHandler )
				trigger.removeEventListener( 'mouseleave', mouseLeaveHandler )
				clearTimeout( resetTimeout )
			}
		},
	},
} )
