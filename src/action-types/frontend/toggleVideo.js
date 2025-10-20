/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	toggleVideo: {
		initAction: action => {
			action.initActionFunction( () => {
				const targets = action.getTargets()
				let startTime = parseFloat( action.getValue( 'startTime' ) )
				const mode = action.getValue( 'mode' )

				const video = targets[ 0 ]?.querySelector( 'video' )
				if ( ! video ) {
					return
				}

				video.preload = 'auto'

				const initPlayVideoAction = () => {
					// If the startTime provided is beyond the video duration,
					// target the duration.
					startTime = Math.min( startTime, video.duration )
					switch ( mode ) {
						case 'play':
							// If no startTime is provided, just play at the currentTime
							if ( startTime ) {
								video.currentTime = startTime
							}
							video.play()
							break

						case 'pause':
							video.pause()
							break

						case 'toggle':
							video.paused ? video.play() : video.pause()
							break
					}
				}

				// Ensure the video is loaded before initializing action
				if ( video.readyState >= 1 ) {
					initPlayVideoAction()
				} else {
					video.addEventListener( 'loadedmetadata', initPlayVideoAction, { once: true } )
				}
			} )
		},
	},
} )
