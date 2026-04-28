/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableCarouselChangeSlide: {
		initAction: action => {
			action.initActionFunction( () => {
				const slide = action.getValue( 'slide' ) || ''

				action.getTargets().forEach( el => {
					const carousel = el.carousel

					// Do not proceed if the target is not a Stackable Carousel
					if ( ! carousel ) {
						return
					}

					if ( slide === '' ) {
						carousel.nextSlide()
					} else {
						carousel.goToSlide( Number( slide ) )
					}
				} )
			} )
		},
	},
} )
