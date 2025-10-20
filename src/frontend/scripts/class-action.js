import { stagger, utils } from '~interact/editor/animejs'

/**
 * The action class is used to create an action object.
 */
export class Action {
	constructor( actionData, timeline ) {
		this.data = actionData // The raw data from the action
		this.timeline = timeline // Our parent timeline object
		// this.targets = this.getTargets()
		this.interactionKey = this.timeline.interaction.key
		this.isPreviewEditing = false // If this was set to true, then we are previewing the action.
	}

	get type() {
		return this.data.type
	}

	get timing() {
		return this.data.timing
	}

	get target() {
		return this.data.target
	}

	get key() {
		return this.data.key
	}

	get debugMode() {
		return this.timeline.debugMode
	}

	stopTimeline() {
		this.timeline.destroy( false )
	}

	getRunner() {
		return this.timeline.getRunner()
	}

	/**
	 * Gets a raw value from the action data
	 *
	 * @param {string} name The name of the option
	 * @return {string} The raw value
	 */
	getRawValue( name ) {
		return this.data.value[ name ]
	}

	/**
	 * Gets a value from the action data, evaluating any expressions
	 *
	 * @param {string} name    The name of the option
	 * @param {string} context Optional context to determine what the value is used
	 *                         for, e.g. "color", "backgroundColor",
	 * @return {string} The evaluated value or expression
	 */
	getValue( name, context ) {
		// return helperFuncs.evaluateValue(
		// 	animation,
		// 	actionData.value[ name ],
		// 	context // This is the context that the value will be used for.
		// )
		let valueOrExpression = this.getRawValue( name )
		if ( typeof valueOrExpression !== 'string' ) {
			return valueOrExpression
		}

		let isReferencedValue = false
		let didFindValue = false

		const getReferencedValue = _name => {
			const name = _name ? _name.trim() : ''
			const dynamicValue = this.timeline.getProvidedValue( name )
			if ( typeof dynamicValue !== 'undefined' ) {
				didFindValue = true
				return dynamicValue
			}
			return ''
		}

		valueOrExpression = valueOrExpression.trim()

		// Values that start with `data.` are dynamic values. e.g. JS reference
		valueOrExpression = valueOrExpression.replace( /data\.([\w\d\-_]+)/g, ( _match, _key ) => {
			isReferencedValue = true
			return getReferencedValue( _key )
		} )

		// Values which are surrounded by `{{` and `}}` are dynamic values.
		valueOrExpression = valueOrExpression.replace( /(\{\{\s*.*?\s*\}\})/g, _match => {
			isReferencedValue = true
			const dynamicValue = _match.slice( 2, -2 )
			return getReferencedValue( dynamicValue )
		} )

		// If we didn't find the value, then we return an empty string.  Only do
		// this if it's a color or background, because those won't animate correctly
		// if we give a non-color value.
		if ( isReferencedValue && ! didFindValue ) {
			if ( context?.toLowerCase().includes( 'color' ) || context === 'background' ) {
				return ''
			}
		}

		return valueOrExpression
	}

	getAllProvidedData() {
		return this.timeline.getAllProvidedData()
	}

	provideData( name, value ) {
		const key = this.getValue( name ) // The value will be saved under this key
		this.timeline.provideData( {
			[ key ]: value,
		} )
		if ( this.debugMode ) {
			// eslint-disable-next-line no-console
			console.debug( `[Interactions Debug] Data for "${ key }" updated:`, { ...this.timeline.getAllProvidedData() } )
		}
	}

	// A target is an element that the action will be applied to.
	getTargets() {
		return this.timeline.interaction.getTargets( this.data.target, this, this.timeline.interaction.getCurrentTrigger() )
	}

	/**
	 * Mutates the options object to fix CSS custom properties for colors into
	 * their current color values so they can be animated smoothly.
	 *
	 * @param {Object} options animation options
	 * @param {Array}  targets element targets
	 */
	fixColorOptions( options, targets ) {
		Object.keys( options ).forEach( key => {
			if ( typeof options[ key ] === 'string' && options[ key ].startsWith( 'var(' ) ) {
				const oldValue = options[ key ]

				// Override the string value into a function that returns the
				// current color. The function will be called by anime.js when
				// the animation starts.
				options[ key ] = () => {
					const computedStyle = window.getComputedStyle( targets[ 0 ] )
					const varName = oldValue.replace( /^var\((.+)\)$/, '$1' ).split( ',' )[ 0 ]
					const color = computedStyle.getPropertyValue( varName )
					return color
				}
			}
		} )
	}

	// Adds an action to an existing animation. Every interaction has 1-2 animation
	// timelines, this is called by every action, adding actions to the timeline.
	initActionAnimation( options ) {
		// const { targets: actionTarget, timing } = actionData
		const targets = options.targets || this.getTargets()

		// Add debugging information.
		if ( this.debugMode ) {
			const onBeginCallback = options.onBegin ? options.onBegin : null
			options.onBegin = args => {
				// eslint-disable-next-line no-console
				console.debug( `[Interactions Debug] Running action:`, { ...this.data }, `on targets:`, targets )
				if ( onBeginCallback ) {
					onBeginCallback( args )
				}
			}
		}

		// If we're in the editor do not allow animations to run on the
		// window/document body or else it will mess up the view.
		if ( this.isPreviewEditing && targets.length === 1 && ( targets[ 0 ] === document.body || targets[ 0 ] === window ) ) {
			return
		}

		// Keep note of all the targets, the timeline will manipulate them.
		this.timeline._targets.push( targets )

		const propsToPass = {}

		// Fix any var() colors to calculate the current color.
		// TODO: Remove this if anime.js already supports live computation for var()
		this.fixColorOptions( options, targets )

		// For time, just add the animation.
		if ( this.timeline.type === 'time' ) {
			if ( this.timing.isStartingState ) {
				// Initialize the starting style, we need to set it on the
				// target so that they will be taken into account by Anime.js
				// during the normal animation. Make sure this is only done once
				// or else our animations will flicker.
				if ( ! this._didStartingSet ) {
					this._animationWithStartingState = utils.set( targets, { ...options, ...propsToPass } )
					this._didStartingSet = true
				} else {
					// This restarts the animation from the starting state
					this._animationWithStartingState.play()
				}
			} else {
				this.timeline._animation.add( targets, {
					...( this.timing.easing === 'custom' ? { ease: this.timing.customEasing } : this.timing.easing ? { ease: this.timing.easing } : {} ),
					duration: ! this.isPreviewEditing ? this.timing.duration * 1000 : 0,
					...options,
					...propsToPass,
				}, this.getStartTime( ( this.timing.start * 1000 ) + 50 ) )
				// Note that we add "50" above as a workaround so that animations
				// can use referred values from the previous action. This is because
				// we can't guarantee that the previous action has finished
				// animating
			}

		// For percentage, we need to pair up the animations since in animeJS, there
		// is no setting of property value for a specific time, so we need to do it
		// manually by setting duration, from and to values.
		} else {
			const uid = this.getUniqueId( targets ) // Create a unique key for these targets for referencing.

			// 1. We first need to see whether we are the first action, if the 1st,
			//    then just record the data.
			if ( typeof this.timeline._actionStarts[ uid ] === 'undefined' ) {
				this.timeline._actionStarts[ uid ] = {}
			}
			if ( typeof this.timeline._actionStarts[ uid ][ this.type ] === 'undefined' ) {
				if ( ! this.timing.isStartingState ) {
					// Memorize the action details because we will need to build by pairs.
					this.timeline._actionStarts[ uid ][ this.type ] = {
						action: this,
						options,
					}

					// If this is not at 0%, then we will need to add a 0% animation so
					// that we can use this as the starting state. (but only if there
					// isn't a starting state yet)
					if ( ! this.timeline._animation._hasStarted ) {
						this.timeline._animation.add( targets, {
							duration: 0,
							...options,
							...propsToPass,
						}, 0 )
						// We need to seek to 0 at the start so that the animation will use the starting state.
						this.timeline._animation.seek( 0 )
					}
				}

			// 2. If we are not the first action, then we need to build the
			//    animation based on the previous and current action pair.
			} else {
				const {
					action: prevAction,
					options: prevOptions,
				} = this.timeline._actionStarts[ uid ][ this.type ]
				const prevTiming = prevAction.timing

				// The duration is from the previous action start to now
				const duration = ( this.timing.start - prevTiming.start )

				// Form the [from, to] array.
				const newOptions = Object.keys( prevOptions ).reduce( ( newOptions, optionName ) => {
					// Handle callbacks like onBegin or onLoop
					if ( optionName.startsWith( 'on' ) || optionName === 'modifier' || optionName === 'composition' ) {
						newOptions[ optionName ] = options[ optionName ]
					} else {
						newOptions[ optionName ] = [ prevOptions[ optionName ], options[ optionName ] ]
					}
					return newOptions
				}, {} )
				// If an animation start state is already present, we build the animation.
				this.timeline._animation.add( prevOptions.targets || prevAction.getTargets(), {
					...( prevTiming.easing === 'custom' ? { ease: prevTiming.customEasing } : prevTiming.easing ? { ease: prevTiming.easing } : {} ),
					duration,
					...newOptions,
					...propsToPass,
				}, this.getStartTime( prevTiming.start, prevTiming ) )
				// Note that we add "50" above as a workaround so that animations
				// can use referred values from the previous action. This is because
				// we can't guarantee that the previous action has finished
				// animating

				// Memorize the action details because we will need it to build the next one if there is a next one.
				this.timeline._actionStarts[ uid ][ this.type ] = {
					action: this,
					options,
				}
			}
		}
	}

	// Adds an action that can only perform a function call to an existing animation.
	// This is used for actions that don't need to animate anything, but just need to
	// perform a function call. If the function call takes a long time, then we can
	// return a Promise and the animation will pause until the promise is resolved.
	initActionFunction( callback ) {
		// We combine the functions with the same start time to make sure that the
		// functions can run one after the other. This is a workaround for the issue
		// where anime.js doesn't run things in the correct order if the start time
		// is the same and can result in a race condition.
		//
		// Scenario: If we have 2 actions: 1) renders a shortcode, then 2) uses the
		// rendered shortcode in a custom JS script, without the workaround, the
		// data will not be available yet because the custom JS may run firsrt.

		// Create a stack of all the function callbacks in the order that they will
		// need to be executed.
		if ( typeof this.timeline._funcPromises === 'undefined' ) {
			this.timeline._funcPromises = {}
		}
		const isFirstCallback = typeof this.timeline._funcPromises[ this.timing.start ] === 'undefined'
		if ( isFirstCallback ) {
			this.timeline._funcPromises[ this.timing.start ] = []
		}

		// Add the action function to the stack.
		this.timeline._funcPromises[ this.timing.start ].push(
			// We need to pass the current targets now or else they might change if
			// we call it during the promise resolving.
			() => {
				// Add debugging information.
				if ( this.debugMode ) {
					// eslint-disable-next-line no-console
					console.debug( `[Interactions Debug] Running action:`, { ...this.data } )
				}
				return callback( this.getTargets() )
			}
		)

		// If this is the first callback, then we need to execute all the callbacks.
		if ( this.timing.start === -1 ) {
			// But just execute the last one added, since the previous ones will
			// already be run.
			const callbackFuncs = this.timeline._funcPromises[ this.timing.start ]
			callbackFuncs[ callbackFuncs.length - 1 ]?.()
		}

		// We only add the animation once in our timeline (Anime.js), so that we
		// can run the function calls in series, waiting for the previous one to
		// finish before running the next. Important: Calling this multiple
		// times will call the entire stack multiple times.
		if ( this.timeline._funcPromises[ this.timing.start ].length === 1 && this.timing.start !== -1 ) {
			if ( this.timeline.type === 'time' ) {
				this.timeline._animation.add( () => {
					// Check if we're allowed to run any action functions.  This
					// can be prevented while editing the timeline because if
					// not the function will keep on running while editing.
					if ( this.getRunner().actionFuncsDisabled ) {
						return
					}

					const wasPaused = this.timeline._animation.paused

					// Pause first before starting.
					this.timeline.pause()

					let promiseResolve = Promise.resolve()

					this.timeline._funcPromises[ this.timing.start ].forEach( callback => {
						promiseResolve = promiseResolve.then( () => {
							const result = callback()

							// If result is false, then the action wants to stop the timeline.
							if ( result === false ) {
								return Promise.reject()
							}

							return result
						} )
					} )

					// Resume when all is done, this needs to be defined last or
					// else it might run early.
					promiseResolve.then( () => {
						if ( ! wasPaused ) {
							this.timeline._animation.play()
						}
					} )
						// We need a catch here since if the timeline was stopped by
						// an action, it can show an error in the browser console.
						.catch( () => {
							if ( this.debugMode ) {
								// eslint-disable-next-line no-console
								console.debug( `[Interactions Debug] Timeline was stopped` )
							}
						} )
				}, this.timing.start * 1000 )
			} else { // Percentage
				this.timeline._animation.add( () => {
					let promiseResolve = Promise.resolve()

					this.timeline._funcPromises[ this.timing.start ].forEach( callback => {
						promiseResolve = promiseResolve.then( () => {
							return callback()
						} )
					} )
				}, this.timing.start )
			}
		}
	}

	// Provides the start time for the timeline, uses stagger if present.
	getStartTime( start, _timing = null ) {
		const timing = _timing || this.timing
		if ( ! timing.stagger ) {
			return start
		}
		return stagger( timing.stagger * 1000, { start } )
	}

	getUniqueId( targets ) {
		return targets.reduce( ( uid, target ) => {
			if ( ! target._interactuid ) {
				target._interactuid = uidCounter++
			}
			return uid + '-' + target._interactuid
		}, 'interact' )
	}

	// This can be called to remove all the starting CSS styles of the action.
	// This is helpful when there might be some styling applied that interferes
	// with the action or animation from working correctly.
	removeStartingStyles() {
		this._ignoreStartingStyles = true
		this.getRunner().recomputeStartingActionStyles()
	}
}

let uidCounter = 1
