import InteractRunner from '../../../frontend/scripts/class-runner'
import { actions as actionsConfig, interactions as interactionsConfig } from 'interactions'
import { getBlockClientId } from './with-tracked-anchors'

const NOOP = () => {}

/**
 * The editor runner is a runner that is used in the editor. It has some
 * additional methods that are used in the editor.
 */
class InteractEditorRunner extends InteractRunner {
	constructor( interactionData, config ) {
		super( interactionData, config )
		this.isFrontend = false

		// If this is true, then the actions that call actionFunctions (not
		// animations) will not run when the a timeline plays or is seeked.
		this.actionFuncsDisabled = false

		this._previewInit = null
		this._previewTimeline = null
		this._domPreviews = []
		this._interactionDestroyer = null
		this._editorConfig = { interactions: {}, actions: {} }
	}

	addInteractionEditorConfig( config ) {
		this._editorConfig.interactions = {
			...this._editorConfig.interactions,
			...config,
		}
	}

	addActionConfig( config ) {
		// If the action doesn't have a preview, remove the initAction so it
		// won't play in the preview.
		Object.keys( config ).forEach( type => {
			if ( ! actionsConfig[ type ]?.hasPreview ) {
				config[ type ].initAction = NOOP
			}
		} )
		super.addActionConfig( config )
	}

	/**
	 * Get the editor document.
	 *
	 * @return {DOMElement} The document where the interactions are being previewed.
	 */
	getDocument() {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' )
		let editorEl = document.querySelector( '.editor-styles-wrapper' )
		if ( iframe ) {
			editorEl = iframe.contentDocument.querySelector( '.editor-styles-wrapper' )
		}
		return editorEl
	}

	getTimelineType( interaction ) {
		return interactionsConfig[ interaction.interactionData.type ]?.timelineType || 'time'
	}

	// Function to convert NamedNodeMap to object
	namedNodeMapToObject( namedNodeMap ) {
		const obj = {}
		if ( typeof namedNodeMap !== 'undefined' ) {
			for ( let i = 0; i < namedNodeMap.length; i++ ) {
				const attr = namedNodeMap[ i ]
				obj[ attr.name ] = attr.value
			}
		}
		return obj
	}

	// Function to apply object attributes to an element
	applyAttributesToObject( element, attributesObj ) {
		// Empty all the attributes of the element
		if ( typeof element.attributes !== 'undefined' ) {
			while ( element.attributes.length > 0 ) {
				element.removeAttribute( element.attributes[ 0 ].name )
			}
		}
		for ( const key in attributesObj ) {
			if ( attributesObj.hasOwnProperty( key ) ) {
				element.setAttribute( key, attributesObj[ key ] )
			}
		}
	}

	_resetPreview() {
		this._previewTimeline?.destroy( true )
		this._previewTimeline = null

		// These are destroy functions from interaction editor initializer.
		if ( this._interactionDestroyer ) {
			this._interactionDestroyer()
			this._interactionDestroyer = null
		}

		this._domPreviews.forEach( el => {
			if ( el._initialState ) {
				this.applyAttributesToObject( el, el._initialState )
				el._initialState = null
			}
		} )

		this._domPreviews = []
		this._previewInit = false
	}

	_initPreview() {
		this._resetPreview()
		if ( this._previewInit ) {
			return
		}

		this._previewInit = true

		const interaction = this.interactions[ 0 ]
		const timeline = interaction.timelines[ 0 ]

		timeline.actions.forEach( action => {
			action.getTargets().forEach( el => {
				if ( el && ! this._domPreviews.includes( el ) ) {
					if ( ! el._initialState ) {
						el._initialState = this.namedNodeMapToObject( el.attributes )
					}
					this._domPreviews.push( el )
				}
			} )
		} )
	}

	playPreview( timelineIndex = 0 ) {
		this._initPreview()

		// If previewing/playing, allow action functions to run.
		this.actionFuncsDisabled = false

		const onUpdate = animation => {
			window.dispatchEvent( new window.CustomEvent( `interact/timeline/animation-update/${ timelineIndex }`, {
				detail: {
					animation,
				},
			} ) )
		}

		const interaction = this.interactions[ 0 ]
		const type = this.getTimelineType( interaction )

		// Reset all isPreviewEditing because editing might have set some to true.
		interaction.timelines[ 0 ].actions.forEach( action => {
			action.isPreviewEditing = false
		} )

		const timeline = interaction.createTimelineInstance( 0, {
			onUpdate,
		} )

		// We need to check for any editor configurations for the interaction
		// type, then call the createInteraction function.
		const interactionEditorConfig = this._editorConfig.interactions[ interaction.interactionData.type ]
		if ( interactionEditorConfig ) {
			this._interactionDestroyer = interactionEditorConfig.initTimeline( timeline, interaction, timelineIndex )
			// We need this or else the animation won't update the first time.
			setTimeout( () => {
				onUpdate( timeline._animation )
			}, 1 )
		}

		// For triggered type timelines, we need to play the animation.
		if ( type === 'time' ) {
			timeline.play()
		}

		this._previewTimeline = timeline
	}

	stopPreview() {
		this._resetPreview()

		// Fire an event to signal that the preview is stopping.
		window.dispatchEvent( new CustomEvent( 'interact/timeline-stop-preview' ) )
	}

	editPreview( selectedAction ) {
		this._initPreview()

		// If editing an action, disallow action functions to run or else it
		// will keep on running when editing.
		this.actionFuncsDisabled = true

		const interaction = this.interactions[ 0 ]
		let startTime = 0

		// Set the selected action to "previewing" so it will show the final
		// effect right away.
		interaction.timelines[ 0 ].actions.find( action => {
			if ( action.key === selectedAction ) {
				startTime = action.timing.start
				action.isPreviewEditing = true
				return true
			}
			return false
		} )
		// Set all other same start time actions to "previewing" so it will show
		// the current state of that time.
		interaction.timelines[ 0 ].actions.forEach( action => {
			if ( action.timing.start === startTime ) {
				action.isPreviewEditing = true
			}
		} )

		const timeline = interaction.createTimelineInstance( 0, { autoplay: false } )

		if ( timeline.type === 'time' ) {
			// We need to add +50 since we delayed all animations by 50ms so all
			// non-animation actions would run first (to ensure calculations go
			// first)
			timeline.seek( ( startTime * 1000 ) + 50 )
		} else { // Percentage
			timeline.seek( startTime )
		}

		this._previewTimeline = timeline
	}

	/**
	 * Gets the client id of the block from an anchor if it exists.
	 *
	 * @param {string} anchor Anchor ID of the block.
	 * @return {string} Block client Id.
	 */
	getBlockClientId( anchor ) {
		return getBlockClientId( anchor )
	}
}

export default InteractEditorRunner
