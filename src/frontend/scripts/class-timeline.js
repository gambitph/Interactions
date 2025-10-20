/**
 * The timeline runs all the actions. This is the only object that should be
 * calling the animation library / AnimeJS
 */
import {
	animate, createTimeline, stagger, utils,
} from '~interact/editor/animejs'
import { Action } from './class-action'

// The timeline contains all dyanmic data, replaces the "helpers" object in the old system.
export class Timeline {
	constructor( timelineData, interaction ) {
		this.timelineData = timelineData
		this.interaction = interaction

		this.type = this.getRunner().getTimelineType( interaction )

		if ( timelineData ) {
			this.actions = this.timelineData.actions.map( actionData => {
				return new Action( actionData, this )
			} )

			// If reset at start is set to true, then always reset the animation when it's starting.
			this._resetAtStart = !! timelineData.reset
			this._onceOnly = !! timelineData.onceOnly
			this._actionStarts = {}
		}

		this._targets = []
	}

	// If true, then the timeline will print out debug logs while running.
	get debugMode() {
		return this.timelineData.debug
	}

	get hasActions() {
		return this.actions.length > 0
	}

	createInstance( options ) {
		// If triggered only once, then we don't create anymore animations.
		// We reference timelineData._played here so that it persists across other timeline instances.
		if ( this.getRunner().isFrontend ) {
			if ( this.timelineData.onceOnly && this.timelineData._played ) {
				return null
			}
		}

		// We have to empty the promises here because we are creating a new timeline.
		// This is to prevent the promises from the previous timeline from affecting the new one.
		this._funcPromises = {}

		this.timelineData._played = true

		const propsToPass = {}
		if ( this.type === 'percentage' ) {
			propsToPass.duration = 100 // 100% so it's easier to compute the actions later.
		}

		const timelineArgs = {
			loop: this.timelineData.loop ? ( this.timelineData.loopTimes || true ) : ( this.timelineData.alternate ? 1 : false ),
			loopDelay: this.timelineData.loop ? ( this.timelineData.loopDelay * 1000 || 0 ) : undefined,
			reversed: this.timelineData.reverse,
			alternate: this.timelineData.alternate,
			...options,
			...propsToPass,
		}

		const frontendArgs = {
			onBegin: () => {
				// Force remove transitions - since it affects our animations.
				const addClass = el => el.style?.setProperty( 'transition', 'none', 'important' )
				this._targets.forEach( el => {
					if ( Array.isArray( el ) ) {
						el.forEach( addClass )
					} else {
						addClass( el )
					}
				} )
				if ( this.debugMode ) {
					// eslint-disable-next-line no-console
					console.debug( `[Interactions Debug] Timeline started. Triggered by:`, this.interaction.getCurrentTrigger() )
				}
			},
			onComplete: () => {
				// Bring back transitions.
				const removeClass = el => el.style?.removeProperty( 'transition' )
				this._targets.forEach( el => {
					if ( Array.isArray( el ) ) {
						el.forEach( removeClass )
					} else {
						removeClass( el )
					}
				} )

				if ( this.debugMode ) {
					// eslint-disable-next-line no-console
					console.debug( `[Interactions Debug] Timeline completed` )
				}
			},
			onLoop: () => {
				if ( this.debugMode ) {
					this._debugLoopCount = ( this._debugLoopCount || 0 ) + 1
					const ordinalCount = this._debugLoopCount === 1 ? '1st' : this._debugLoopCount === 2 ? '2nd' : this._debugLoopCount === 3 ? '3rd' : `${ this._debugLoopCount }th`
					// eslint-disable-next-line no-console
					console.debug( `[Interactions Debug] Looping: ${ ordinalCount } time` )
				}
			},
		}

		const animation = createTimeline( {
			...timelineArgs,
			autoplay: false,
			defaults: {
				ease: 'outCirc',
				autoplay: false,
			},
			...( this.getRunner().isFrontend ? frontendArgs : {} ),
		} )

		// We need to add this for force the animation to play from 0-100. Or
		// else if we have an action that doesn't end at 100, our animation will
		// stretch the last action to be 100
		if ( this.type === 'percentage' ) {
			animation.add( { duration: 100 }, 0 )
		}

		// Store all our targets here so we can reference them and destroy them later.
		this._targets = []

		// For percentage based animations, we need to store the start time of each
		this._actionStarts = {}

		// Data that's acquired by actions and can be used by other actions.
		this._dynamicData = {}

		if ( this.debugMode ) {
			// eslint-disable-next-line no-console
			console.debug( '[Interactions Debug] Interaction starting: ', this.interaction.data )
			// eslint-disable-next-line no-console
			console.debug( '[Interactions Debug] Initializing timeline with arguments:', timelineArgs )
		}

		this._animation = animation

		// Initialize actions.
		this.actions.forEach( action => {
			const actionConfig = this.getRunner().getActionConfig( action.type )
			if ( actionConfig ) {
				actionConfig.initAction( action )
			}
		} )

		return this
	}

	getRunner() {
		return this.interaction.getRunner()
	}

	getProvidedValue( name ) {
		if ( this._dynamicData[ name ] ) {
			return this._dynamicData[ name ]
		}
		return undefined
	}

	getAllProvidedData() {
		return this._dynamicData
	}

	provideData( data ) {
		this._dynamicData = { ...this._dynamicData, ...data }
	}

	// Provides the start time for the timeline, uses stagger if present.
	getStartTime( start, timing ) {
		if ( ! timing.stagger ) {
			return start
		}
		return stagger( timing.stagger * 1000, { start } )
	}

	getProgress() {
		if ( this._animation ) {
			return this._animation.currentTime / this._animation.duration
		}
		return 0
	}

	play() {
		if ( this._animation ) {
			this._animation.reset()
			this._animation.play()
		}
	}

	seek( time ) {
		if ( this._animation ) {
			this._animation.seek( time )
		}
	}

	/**
	 * Seeks the animation to a percentage.
	 *
	 * @param {float} percentage Percentage from 0 to 1
	 * @param {int}   smoothness If 0, the animation will seek directly to the
	 *                           percentage. If not 0, the animation will seek to the percentage with a
	 *                           smoothness effect. Default smoothness in the frontend is 200.
	 */
	seekPercentage( percentage, smoothness = 0 ) {
		if ( this._animation ) {
			if ( smoothness ) {
				const smoothnessInt = parseInt( smoothness, 10 )
				// Make it so the farther the percentage is from the current progress, the longer the duration.
				let smoothDuration = utils.lerp( 0, 1, Math.abs( percentage - this._animation.progress ) )
				smoothDuration = smoothDuration * smoothDuration
				// Get the duration taking into account the smoothness.
				smoothDuration = utils.interpolate( smoothnessInt, smoothnessInt + 300, smoothDuration )
				// The end duration would be shorter then smaller the percentage is from the current progress.
				animate( this._animation, {
					progress: percentage,
					duration: smoothDuration,
					ease: 'outQuad',
					composition: this.getRunner().isFrontend ? 'blend' : 'replace',
				} )
			} else {
				this._animation.seek( this._animation.duration * percentage )
			}
		}
	}

	pause() {
		if ( this._animation ) {
			this._animation.pause()
		}
	}

	destroy( reset = true ) {
		if ( this.timelineData.loop && this.timelineData.onceOnly ) {
			return
		}
		if ( this._animation ) {
			// We need to check onceOnly because we don't want to reset the
			// animation if it will only play once.
			const resetAtStart = this._resetAtStart && ! this._onceOnly
			this._animation.pause()
			if ( reset || resetAtStart ) {
				this._animation.revert()
			} else {
				this._animation.cancel()
			}
			// DEV NOTE: Comment this out because it makes animations skip when transitioning from hover in to hover out, and stops "play once" from working.
			// utils.cleanInlineStyles( this._animation ) // Removes all inline styles.
		}
	}
}
