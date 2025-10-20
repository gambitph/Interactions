/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	pageScrolling: {
		initTimeline: interaction => {
			const smoothness = interaction.getOption( 'smoothness', 200 )
			const animation = interaction.createTimelineInstance( 0, {} )

			const scrollHandler = isFirstCall => {
				const winScroll = document.body.scrollTop || document.documentElement.scrollTop
				const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
				const scrolled = winScroll / height
				animation.seekPercentage( scrolled, isFirstCall === true ? 0 : smoothness )
			}

			window.addEventListener( 'scroll', scrollHandler )
			scrollHandler( true )

			return () => {
				animation.destroy()
				window.removeEventListener( 'scroll', scrollHandler )
			}
		},
	},
} )
