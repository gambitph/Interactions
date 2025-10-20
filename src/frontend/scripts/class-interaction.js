/**
 * An Interaction runs all the timelines.  This is the object class that's
 * passed to the config `createInteraction` function.
 */
import { Timeline } from './class-timeline'

export class Interaction {
	constructor( interactionData, runner ) {
		this.interactionData = interactionData
		this.runner = runner
		this._destroyFuncs = []

		if ( this.interactionData ) {
			this.timelines = this.interactionData.timelines.map( timelineData => {
				return new Timeline( timelineData, this )
			} )
		}
	}

	get data() {
		return this.interactionData
	}

	get key() {
		return this.interactionData.key
	}

	get type() {
		return this.interactionData.type
	}

	getRunner() {
		return this.runner
	}

	getDocument() {
		return this.runner.getDocument()
	}

	getOption( name, defaultValue ) {
		if ( typeof this.interactionData.options?.[ name ] !== 'undefined' && this.interactionData.options?.[ name ] !== '' ) {
			return this.interactionData.options?.[ name ]
		}
		return defaultValue
	}

	// This method is called by the configuration to create the actual timeline and then run it immediately.
	createTimelineInstance( timelineIndex = 0, options = {} ) {
		return this.timelines[ timelineIndex ].createInstance( options )
	}

	// Creates a "clone" of this Interaction object, but with a different trigger.
	// This creates only a shallow clone, so the timelines are shared between the
	// two interactions - we save memory!
	cloneWithTrigger( triggerEl ) {
		// Return a new Interaction cloned from this one
		const newInteraction = new Interaction()

		// Copy all properties from this to the new interaction
		Object.assign( newInteraction, this )
		newInteraction._currentTrigger = triggerEl

		// Also create new instances of the timelines.
		newInteraction.timelines = this.timelines.map( ( timeline, i ) => {
			return new Timeline( this.interactionData.timelines[ i ], newInteraction )
		} )

		return newInteraction
	}

	init() {
		let triggerElements = this.getTargets( this.interactionData.target )

		// Call the initTimeline from the interaction's configuration.
		const interactionConfig = this.runner.getInteractionConfig( this.interactionData.type )

		// Set the triggerElements to the document body for page interactions
		if ( interactionConfig?.type === 'page' && triggerElements.length === 0 ) {
			triggerElements = [ document.body ]
		}

		this.triggerElements = triggerElements

		// Initialize the starting state of the actions in t
		if ( interactionConfig ) {
			triggerElements.forEach( triggerEl => {
				// We pass a shallow clone of this interaction with the trigger changed
				const instancedInteraction = this.cloneWithTrigger( triggerEl )
				const destroy = interactionConfig.initTimeline( instancedInteraction )
				if ( destroy ) {
					this._destroyFuncs.push( destroy )
				}
			} )
		}
	}

	/**
	 * Returns all the triggers that can trigger this interaction. This is
	 * usually helpful if you want to also manipulate the other triggers when
	 * one is clicked.
	 *
	 * @return {Array} Array of DOMElements that can trigger this interaction.
	 */
	getTriggers() {
		return this.triggerElements
	}

	/**
	 * Returns the current trigger that's being interacted with.
	 *
	 * @return {DOMElement} The current trigger element.
	 */
	getCurrentTrigger() {
		return this._currentTrigger || ( this.triggerElements && this.triggerElements[ 0 ] )
	}

	destroy() {
		this._destroyFuncs.forEach( fn => fn() )
	}

	/**
	 * Gathers all the actions that adds an initial state to the target, and
	 * compiles all the CSS to bring the target to its initial state. Note that
	 * this just compiles them, the actual applying is done by the Runner class.
	 */
	compileStartingStyles() {
		const triggerSelector = this.getTargetsSelector( this.interactionData.target )

		const cssObject = {}
		this.timelines.forEach( timeline => {
			timeline.actions.forEach( action => {
				if ( ! action.timing.isStartingState ) {
					return ''
				}

				// If the removeStartingStyles is called, then we don't need to do this.
				if ( action._ignoreStartingStyles ) {
					return ''
				}

				const actionConfig = this.runner.getActionConfig( action.type )
				if ( ! actionConfig ) {
					return ''
				}

				let actionTargetSelector = this.getTargetsSelector( action.target, triggerSelector )

				// TODO: Move this to the action class
				// Run the blockElementSelector function if it exists.  This function
				// allows us to target a specific element depending on the block.
				if ( actionConfig.blockElementSelector && ( action.target.type === 'block' || action.target.type === 'block-name' || action.target.type === 'class' ) ) {
					const blockName = action.target.type === 'block' ? action.target.blockName : action.target.value
					actionTargetSelector = actionConfig.blockElementSelector( actionTargetSelector, new TargetBlock( blockName ) )
				}

				// If we're in the editor, don't set the initial styles
				// unless the action is clicked.
				if ( actionConfig.initialStyles && this.runner.isFrontend ) {
					const styles = actionConfig.initialStyles( action )
					if ( ! cssObject[ actionTargetSelector ] ) {
						cssObject[ actionTargetSelector ] = []
					}
					if ( styles ) {
						cssObject[ actionTargetSelector ].push( styles )
					}
				}
			} )
		} )

		let css = ''
		if ( Object.keys( cssObject ).length ) {
			Object.keys( cssObject ).forEach( selector => {
				let cssSegment = `${ selector } {`

				// Combine all the styles together.
				const styleArr = cssObject[ selector ]
				styleArr.forEach( style => {
					if ( style.startsWith( 'transform:' ) && cssSegment.includes( 'transform:' ) ) {
						cssSegment = cssSegment.replace( 'transform:', style.replace( /;$/, '' ) )
						return
					}
					cssSegment += style
				} )
				cssSegment += `}`

				css += cssSegment
			} )
		}

		return css
	}

	/**
	 * Gathers all the scripts that adds an initial state to the target, and
	 * compiles all the functions to bring the target to its initial state. Note
	 * that this just gathers the functions, the actual running is done by the
	 * Runner class.
	 */
	compileStartingScripts() {
		const scripts = []
		this.timelines.forEach( timeline => {
			timeline.actions.forEach( action => {
				const actionConfig = this.runner.getActionConfig( action.type )
				if ( ! actionConfig ) {
					return ''
				}

				// Allow actions to have initializeAction function to run when
				// the page is ready.
				// if ( actionConfig.initializeAction ) {
				// 	scripts.push( () => {
				// 		try {
				// 			// Get the action's target elements based on the trigger.
				// 			const triggerElements = this.getTargets( this.interactionData.target )
				// 			triggerElements.forEach( triggerEl => {
				// 				const targetEls = this.getTargets( action.target, null, triggerEl )
				// 				actionConfig.initializeAction( action, targetEls )
				// 			} )
				// 		} catch ( err ) {
				// 			// eslint-disable-next-line no-console
				// 			console.log( '[Interactions] Error in initializeAction: ', err )
				// 		}
				// 	} )
				// }

				if ( ! action.timing.isStartingState ) {
					return ''
				}

				if ( actionConfig.runInitialScript ) {
					scripts.push( () => {
						try {
							// Get the action's target elements based on the trigger.
							const triggerElements = this.getTargets( this.interactionData.target )
							triggerElements.forEach( triggerEl => {
								const targetEls = this.getTargets( action.target, null, triggerEl )
								actionConfig.runInitialScript( action, targetEls )
							} )
						} catch ( err ) {
							// eslint-disable-next-line no-console
							console.log( '[Interactions] Error in runInitialScript: ', err )
						}
					} )
				}
			} )
		} )

		return scripts
	}

	// Grabs all the DOM elements that match the target object.  this also fixes
	// the target for the block if needed if the action needs to alter the
	// target.
	getTargets( targetObject, action = null, currentTrigger = null ) {
		const targets = this._getTargets( targetObject, currentTrigger )
		if ( action ) {
			return this.fixTargetForBlock( targets, action )
		}
		return targets
	}

	// Grabs all the DOM elements that match the target object.
	_getTargets( targetObject, currentTrigger ) {
		const {
			type, value, options = '',
		} = targetObject

		if ( type === 'trigger' ) {
			return Array.isArray( currentTrigger ) ? currentTrigger : [ currentTrigger ]
		}

		if ( type === 'window' ) {
			return [ window ]
		}

		if ( type === 'document' ) {
			return [ document ]
		}

		const selector = type === 'block' ? `#${ value }`
			: type === 'class' ? `.${ value }`
				: type === 'block-name' ? this._getBlockNameSelector( value )
					: value

		let targets = []
		try {
			targets = Array.from( this.getDocument().querySelectorAll( selector ) )
		} catch ( err ) {
		}

		return options ? this._filterTargets( targets, options, currentTrigger ) : targets
	}

	/**
	 * This filters the target to include only those that satisfy the matching
	 * filter. e.g. if the filter is 'content-area', then only targets that are
	 * inside the content area will be returned.
	 *
	 * @param {DOMElement} targets        The targets to filter.
	 * @param {string}     filter         The filter to apply.
	 * @param {DOMElement} currentTrigger The current trigger to base the
	 *                                    matching with if needed.
	 * @return {Array} The filtered targets.
	 */
	_filterTargets( targets, filter, currentTrigger ) {
		// Only use the first matching target
		if ( filter === 'first' ) {
			return targets.slice( 0, 1 )
		// Only use the last matching target
		} else if ( filter === 'last' ) {
			return targets.slice( -1 )
		}

		return targets.reduce( ( validTargets, target ) => {
			// The target should be inside the content area
			if ( filter === 'content-area' ) {
				if ( ! this.isFrontend ) {
					validTargets.push( target )
				} else if ( target.closest( '.entry-content' ) ) {
					validTargets.push( target )
				}
			// The target should not be the trigger.
			} else if ( filter === 'not-trigger' ) {
				if ( target !== currentTrigger ) {
					validTargets.push( target )
				}
			// The target should be a child of the trigger
			} else if ( filter === 'children' ) {
				if ( currentTrigger?.contains( target ) && target !== currentTrigger ) {
					validTargets.push( target )
				}
			// The target should be a sibling of the trigger (not including the trigger)
			} else if ( filter === 'siblings' ) {
				if ( target.parentElement === currentTrigger?.parentElement && target !== currentTrigger ) {
					validTargets.push( target )
				}
			// The target should be a sibling of the trigger (including the trigger)
			} else if ( filter === 'siblings-with-trigger' ) {
				if ( target.parentElement === currentTrigger?.parentElement ) {
					validTargets.push( target )
				}
			// The target should be a parent of the trigger
			} else if ( filter === 'parent' ) {
				if ( target.contains( currentTrigger ) ) {
					validTargets.push( target )
				}
			// The target should have the same index of the trigger
			} else if ( filter === 'same-index' ) {
				const index = Array.from( currentTrigger?.parentElement.children || [] ).indexOf( currentTrigger )
				if ( target.parentElement.children[ index ] === target && target !== currentTrigger ) {
					validTargets.push( target )
				}
			// The target should have the same index of the trigger
			} else if ( filter === 'same-index-with-trigger' ) {
				const index = Array.from( currentTrigger?.parentElement.children || [] ).indexOf( currentTrigger )
				if ( target.parentElement.children[ index ] === target ) {
					validTargets.push( target )
				}
			// The target should not have the same index as the trigger
			} else if ( filter === 'not-same-index' ) {
				const index = Array.from( currentTrigger?.parentElement.children || [] ).indexOf( currentTrigger )
				if ( target.parentElement.children[ index ] !== target && target !== currentTrigger ) {
					validTargets.push( target )
				}
			// Only use the first matching target
			} else if ( filter === 'first' ) {
				if ( validTargets.length === 0 ) {
					validTargets.push( target )
				}
			}
			return validTargets
		}, [] )
	}

	// Grabs the DOM selector that matches the target object.
	getTargetsSelector( targetObject, triggerSelector = '' ) {
		const {
			type, value, options,
		} = targetObject

		if ( type === 'trigger' ) {
			return triggerSelector
		}

		const targetSelector = type === 'block' ? this._getBlockSelector( value )
			: type === 'class' ? `.${ value }`
				: type === 'block-name' ? this._getBlockNameSelector( value )
					: value

		return options ? this._filterTargetsSelector( targetSelector, options, triggerSelector ) : targetSelector
	}

	/**
	 * This adjusts the target selector to include only those that satisfy the
	 * matching filter. e.g. if the filter is 'siblings', then the selector will
	 * be adjusted to only target the siblings of the currentTriggerSelector.
	 *
	 * @param {string} _targetSelector        The target selector to filter.
	 * @param {string} filter                 The filter to apply.
	 * @param {string} currentTriggerSelector The current trigger to base
	 *                                        the matching with if needed.
	 * @return {string} The filtered targets.
	 */
	_filterTargetsSelector( _targetSelector, filter, currentTriggerSelector ) {
		// If there is a comma, it means that we are trying to select multiple
		// elements, we need to wrap in :is so that the selector works as
		// intented.
		const targetSelector = _targetSelector.includes( ',' ) ? `:is(${ _targetSelector })` : _targetSelector

		// The target should be inside the content area
		if ( filter === 'content-area' ) {
			if ( ! this.isFrontend ) {
				return targetSelector
			}
			return `.entry-content ${ targetSelector }`

		// The target should not be the trigger.
		} else if ( filter === 'not-trigger' ) {
			return `${ targetSelector }:not(${ currentTriggerSelector })`
		// The target should be a child of the trigger
		} else if ( filter === 'children' ) {
			return `${ currentTriggerSelector } ${ targetSelector }`
		// The target should be a sibling of the trigger (not including the trigger)
		} else if ( filter === 'siblings' ) {
			return `*:has(> ${ currentTriggerSelector }) > ${ targetSelector }:not(${ currentTriggerSelector })`
		// The target should be a sibling of the trigger (including the trigger)
		} else if ( filter === 'siblings-with-trigger' ) {
			return `*:has(> ${ currentTriggerSelector }) > ${ targetSelector }`
		// The target should be a parent of the trigger
		} else if ( filter === 'parent' ) {
			return `*:has(> ${ currentTriggerSelector }) ${ targetSelector }`
		}

		// Note that the other filters are not applicable to selectors!
		return targetSelector
	}

	_getBlockSelector( blockId ) {
		if ( this.runner.isFrontend ) {
			return `#${ blockId }`
		}

		// For the backend, use the client id.
		const clientId = this.runner.getBlockClientId( blockId )
		return clientId ? `#block-${ clientId }` : `#${ blockId }`
	}

	// Forms the block selector if the value is a block type name e.g. core/paragraph.
	_getBlockNameSelector( blockName ) {
		// For the backend, the Block Editor always uses this.
		if ( ! this.runner.isFrontend ) {
			return `[data-type="${ blockName }"]`
		}

		if ( blockName.startsWith( 'core/' ) ) {
			return `.wp-block-${ blockName.replace( 'core/', '' ) }`
		}

		return `.wp-block-${ blockName.replace( '/', '-' ) }`
	}

	// Run the blockElementSelector function if it exists. Allow each action to
	// target a specific element depending on the block if needed. For example,
	// for the cover block, the background color would need to be an inside
	// element.
	fixTargetForBlock( targets, action ) {
		const actionConfig = this.runner.getConfig().actions[ action.type ]
		if ( ! actionConfig ) {
			return targets
		}
		return targets
			.map( el => {
				if ( actionConfig.blockElementSelector ) {
					const selector = actionConfig.blockElementSelector( ':scope', new TargetBlock( el ) )
					if ( selector !== ':scope' ) {
						return el.querySelector( selector ) || el // Make sure this is never null or the editor will error.
					}
				}
				return el
			} )
			.filter( el => el !== null && el !== undefined ) // Ensure only valid elements are included
	}
}

class TargetBlock {
	constructor( blockNameOrElement ) {
		this.blockNameOrElement = blockNameOrElement
	}

	isBlock( blockName ) {
		if ( ! this.blockNameOrElement ) {
			return false
		}

		if ( typeof this.blockNameOrElement === 'string' ) {
			return this.blockNameOrElement === blockName
		}

		const blockClass = blockName.replace( /^core\//g, '' ).replace( /\//g, '-' )
		return this.blockNameOrElement.classList.contains( `wp-block-${ blockClass }` )
	}
}
