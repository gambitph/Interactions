import {
	currentPostId,
	currentPostParent,
	currentPostTemplate,
	currentPostType,
	pluginVersion,
	srcUrl,
} from 'interactions'
import { select } from '@wordpress/data'

const NOOP = () => {}
let builderEditorStylesPromise = null

// Base editor adapter that defines the shared editor contract.
class InteractionsEditorAbstract {
	constructor() {
		this.initialized = false
	}

	// Boot the current editor integration.
	init() {
		this.initialized = true
		return this
	}

	// Return the current editor mode.
	getEditorMode() {
		throw new Error( 'InteractionsEditorAbstract#getEditorMode must be implemented.' )
	}

	isElementor() {
		return this.getEditorMode() === 'elementor'
	}

	isBricks() {
		return this.getEditorMode() === 'bricks'
	}

	isDivi() {
		return this.getEditorMode() === 'divi'
	}

	isGutenberg() {
		return this.getEditorMode() === 'gutenberg'
	}

	isBuilder() {
		return this.isElementor() || this.isBricks() || this.isDivi()
	}

	ensureBuilderEditorStyles() {
		if ( ! this.isBuilder() ) {
			return Promise.resolve()
		}

		if ( document.getElementById( 'interact-editor-wp-components-scoped-css' ) ) {
			return Promise.resolve()
		}

		if ( builderEditorStylesPromise ) {
			return builderEditorStylesPromise
		}

		builderEditorStylesPromise = new Promise( resolve => {
			const link = document.createElement( 'link' )
			link.id = 'interact-editor-wp-components-scoped-css'
			link.rel = 'stylesheet'
			link.href = `${ srcUrl }/dist/wp-components-scoped.css?ver=${ pluginVersion }`
			link.onload = () => resolve()
			link.onerror = () => resolve()
			document.head.appendChild( link )
		} )

		return builderEditorStylesPromise
	}

	// Return the current document context for location rule matching.
	getCurrentPostContext() {
		const editorStore = select( 'core/editor' )
		return {
			postId: editorStore?.getCurrentPostId?.() || currentPostId || 0,
			postType: editorStore?.getCurrentPostType?.() || currentPostType || '',
			postTemplate: editorStore?.getCurrentPost?.()?.template || currentPostTemplate || '',
			postParent: editorStore?.getCurrentPost?.()?.parent || currentPostParent || 0,
		}
	}

	getCanvasDocument() {
		return document
	}

	getCanvasElement() {
		const canvasDocument = this.getCanvasDocument()
		return canvasDocument?.querySelector( '.editor-styles-wrapper' ) || canvasDocument?.body || document.body
	}

	// Open the editor panel when supported by the current integration.
	openPanel() {
		return null
	}

	openInteractionsPanel() {
		return this.openPanel()
	}

	getSelectedBlockAnchor() {
		return null
	}

	getCurrentSelectedTarget() {
		return null
	}

	registerSelectionTracking() {
		return NOOP
	}

	// Persist the parent editor when the interaction data should also be saved.
	saveEditor() {
		return Promise.resolve()
	}

	// Start an editor-specific target picker.
	startElementPicker( args = {} ) {
		const {
			onCancel = NOOP,
		} = args
		onCancel()
		return NOOP
	}
}

export default InteractionsEditorAbstract
