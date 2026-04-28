/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	stackableCarouselSlideChange: {
		initTimeline: interaction => {
			const slide = interaction.getOption( 'slide', '' )

			let timeline = null
			const handler = event => {
				const currentSlide = event.detail?.currentSlide
				// If a slide number is provided, trigger when the carousel changes into that slide,
				// otherwise, trigger on every slide change.
				if ( slide === '' || Number( slide ) === currentSlide ) {
					timeline?.destroy( false )

					timeline = interaction.createTimelineInstance( 0 )
					timeline?.play()
				}
			}

			const el = interaction.getCurrentTrigger()

			// Do not proceed if the target is not a Stackable Carousel
			if ( el.classList?.contains( 'wp-block-stackable-carousel' ) ) {
				el.addEventListener( 'stackable-carousel-slide-change', handler )

				return () => {
					timeline?.destroy()
					el.removeEventListener( 'stackable-carousel-slide-change', handler )
				}
			}
		},
	},
} )
