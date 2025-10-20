/**
 * The Runner runs all the interactions
 */

import { domReady } from '~interact/shared/dom-ready.js'
import { Interaction } from './class-interaction'

class InteractRunner {
	constructor() {
		this._config = { interactions: {}, actions: {} }
		this._interactionData = {}
		this._initialCallbacks = []
		this._startingStyles = ''
		this.isFrontend = true
		this.interactions = []
	}

	// Spawn an identical runner
	spawn() {
		const runner = new this.constructor()
		Object.assign( runner, this )
		return runner
	}

	/**
	 * Interaction config.
	 *
	 * @param {Object} config
	 */
	addInteractionConfig( config ) {
		// Combine, even if the interaction is already defined, overwrite properties.
		Object.keys( config ).forEach( key => {
			// Merge the properties of the interaction.
			this._config.interactions[ key ] = {
				...( this._config.interactions[ key ] || {} ),
				...config[ key ],
			}
		} )
	}

	/**
	 * Action config.
	 * @param {Object} config
	 */
	addActionConfig( config ) {
		this._config.actions = {
			...this._config.actions,
			...config,
		}
	}

	getConfig() {
		return this._config
	}

	getInteractionConfig( type ) {
		return this._config.interactions[ type ]
	}

	getActionConfig( type ) {
		return this._config.actions[ type ]
	}

	getDocument() {
		return document
	}

	getTimelineType( interaction ) {
		return this.getInteractionConfig( interaction.type )?.timelineType
	}

	/**
	 * Configure the runner with interactions, this is called when the frontend
	 * page is loaded and creates all the necessary objects.
	 *
	 * @param {Array} interactionsData
	 */
	configure( interactionsData ) {
		if ( this.interactions.length ) {
			this.interactions.forEach( interaction => {
				interaction.destroy( true )
			} )
		}

		this._interactionData = interactionsData
		this.interactions = []

		this._interactionData.forEach( interactionData => {
			// Create Interactions
			this.interactions.push(
				new Interaction( { ...interactionData }, this )
			 )
		} )

		// Initialize the starting state actions. Starting state is done in
		// 2 parts, this is the 1st part: we manually write the styles of
		// the starting state, so that when the page loads, it will be in
		// the starting state and won't flicker.
		this.configureStartingActions()
	}

	/**
	 * Initialize the starting state actions. This is required so that the
	 * initial states do not flicker the moment the page loads.
	 */
	configureStartingActions() {
		this._startingStyles = ''

		// Some actions might need to run some script when the page is ready.
		this._initialCallbacks = []

		this.interactions.forEach( interaction => {
			// Compile all the starting styles of the interaciton.
			this._startingStyles += interaction.compileStartingStyles()

			// Keep track of all the scripts that need to be run when the DOM is
			// ready. This will be called during init.
			this._initialCallbacks = [
				...this._initialCallbacks,
				...interaction.compileStartingScripts(), // This returns an array of functions.
			]
		} )

		if ( this.isFrontend ) {
			// We load the styles in a style tag, at the head so it loads before all
			// the elements.
			this._initStylesEl = document.createElement( 'style' )
			this._initStylesEl.setAttribute( 'id', 'interact-action-starting-states' )
			this._initStylesEl.innerHTML = this._startingStyles
			document.head.appendChild( this._initStylesEl )
		}
	}

	/**
	 * Recompiles the starting state styles, then updates the styles in the
	 * initial styles tag.
	 */
	recomputeStartingActionStyles() {
		this._startingStyles = this.interactions.map( interaction => {
			return interaction.compileStartingStyles()
		} ).join( '' )

		if ( this.isFrontend ) {
			// We load the styles in a style tag, at the head so it loads before all
			// the elements.
			if ( this._initStylesEl ) {
				this._initStylesEl.innerHTML = this._startingStyles
			}
		}
	}

	getStartingActionStyles() {
		return this._startingStyles
	}

	/**
	 * Initializes all animations, and attaches all event listeners.
	 * Note: This needs to be called on domReady or else the animations won't be created.
	 */
	init() {
		if ( this.isFrontend && this._initialCallbacks.length ) {
			domReady( () => {
				this._initialCallbacks.forEach( callback => callback() )
			} )
		}

		// Initialize all the interactions.
		this.interactions.forEach( interaction => {
			interaction.init()
		} )
	}

	/**
	 * Removes all created animations, and removes all event listeners. This
	 * also resets the animations back to their original state. This means you
	 * can call destroy and init any time.
	 */
	destroy() {
		this.interactions.forEach( interaction => {
			interaction.destroy()
		} )
	}
}

export default InteractRunner
