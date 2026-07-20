import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'
import { InteractionLibraryRoot } from '../interaction-library'

import { __ } from '@wordpress/i18n'
import { Button } from '@wordpress/components'
import {
	createRoot,
	useEffect,
	useState,
} from '@wordpress/element'
import { customAlphabet } from 'nanoid'

const NOOP = () => {}
const generateInteractionTargetId = customAlphabet( '1234567890abcdef', 10 )

// Divi editor adapter for the initial Visual Builder integration milestone.
class DiviInteractionsEditor extends InteractionsEditorAbstract {
	constructor() {
		super()
		this.selectedElement = null
		this.selectionTrackingCleanup = null
	}

	getEditorMode() {
		return 'divi'
	}

	// Mount the Divi launcher and builder panel shell in the top window only.
	init() {
		if ( this.initialized ) {
			return this
		}

		// Divi loads the page canvas in a separate app window iframe. Keep the
		// Interactions shell in the top window so it mounts only once.
		if ( window.frameElement ) {
			return super.init()
		}

		const mountNodeId = 'interact-divi-root'
		if ( document.getElementById( mountNodeId ) ) {
			return super.init()
		}

		const editor = this
		const DiviInteractionsEditorComponent = () => {
			const [ isOpen, setIsOpen ] = useState( false )

			const openPanel = () => {
				editor.ensureBuilderEditorStyles().then( () => {
					setIsOpen( true )
				} )
			}

			useEffect( () => {
				const openHandler = () => openPanel()
				window.addEventListener( 'interact/open-divi-sidebar', openHandler )
				return () => window.removeEventListener( 'interact/open-divi-sidebar', openHandler )
			}, [] )

			return (
				<>
					<Button
						className={ `interact-divi-launcher${ isOpen ? ' is-hidden' : '' }` }
						variant="primary"
						icon={ <IconSVG width="18" height="18" /> }
						onClick={ () => {
							if ( isOpen ) {
								setIsOpen( false )
								return
							}

							openPanel()
						} }
					>
						{ __( 'Interactions', 'interactions' ) }
					</Button>
					<div className={ `interact-pagebuilder-panel interact-divi-panel${ isOpen ? ' is-open' : '' }` }>
						<div className="interact-pagebuilder-panel__header">
							<div className="interact-pagebuilder-panel__title">
								<IconSVG width="18" height="18" />
								<span>{ __( 'Interactions', 'interactions' ) }</span>
							</div>
							<Button
								className="interact-pagebuilder-panel__close"
								icon="no-alt"
								variant="tertiary"
								label={ __( 'Close Interactions', 'interactions' ) }
								onClick={ () => setIsOpen( false ) }
							/>
						</div>
						<div className="interact-pagebuilder-panel__body">
							<div className="interact-sidebar interact-pagebuilder-sidebar interact-divi-sidebar">
								<InteractionsApp enablePostPreviewGuard={ false } />
							</div>
						</div>
					</div>
					<InteractionLibraryRoot />
				</>
			)
		}

		const mountNode = document.createElement( 'div' )
		mountNode.id = mountNodeId
		mountNode.className = 'interact-builder-root interact-divi-root'
		document.body.appendChild( mountNode )
		document.body.classList.add( 'interact-builder-editor' )
		document.body.classList.add( 'interact-divi-editor' )
		this.registerSelectionTracking()
		createRoot( mountNode ).render( <DiviInteractionsEditorComponent /> )

		return super.init()
	}

	openPanel() {
		window.dispatchEvent( new CustomEvent( 'interact/open-divi-sidebar' ) )
		return null
	}

	saveEditor() {
		// Reuse Divi's own save button so the builder persists the current page
		// after an interaction modifies module attributes such as target IDs.
		const saveButton = Array.from( document.querySelectorAll( '.et-vb-page-bar-action-button' ) )
			.find( button => button.textContent?.trim() === 'Save' )

		if ( ! saveButton || saveButton.disabled ) {
			return Promise.resolve()
		}

		saveButton.click()
		return Promise.resolve()
	}

	getCanvasDocument() {
		const iframe = document.querySelector( 'iframe[src*="app_window=1"]' )
		return iframe?.contentDocument || null
	}

	getCanvasWindow() {
		const iframe = document.querySelector( 'iframe[src*="app_window=1"]' )
		return iframe?.contentWindow || null
	}

	getDiviDataApi() {
		const canvasWindow = this.getCanvasWindow()

		// Prefer the builder iframe first because Divi mounts most of its runtime
		// there, then fall back to any mirrored top-window stores.
		return (
			canvasWindow?.wp?.data ||
			canvasWindow?.divi?.data ||
			window.top?.wp?.data ||
			window.top?.divi?.data ||
			window.wp?.data ||
			window.divi?.data ||
			null
		)
	}

	getModuleIdFromElement( element ) {
		const targetElement = this.getSelectableElement( element )
		if ( ! targetElement ) {
			return ''
		}

		// Divi exposes the module identity on a few different attributes depending
		// on the element type, so check the common variants in one place.
		const moduleId =
			targetElement.getAttribute( 'data-id' ) ||
			targetElement.getAttribute( 'data-wrapper-id' ) ||
			targetElement.getAttribute( 'data-module-id' ) ||
			targetElement.dataset?.id ||
			targetElement.dataset?.wrapperId ||
			targetElement.dataset?.moduleId ||
			''

		return typeof moduleId === 'string' ? moduleId : ''
	}

	getStoredInteractionTarget( moduleId ) {
		if ( ! moduleId ) {
			return ''
		}

		const attrs = this.getDiviDataApi()?.select?.( 'divi/edit-post' )?.getModuleAttrs?.( moduleId )

		// The store can return either Immutable-style values or plain objects, so
		// support both shapes and normalize them to a simple string.
		const interactionTarget = attrs?.getIn?.(
			[ 'module', 'decoration', 'interactionTarget' ],
			''
		) ?? attrs?.module?.decoration?.interactionTarget ?? ''

		if ( interactionTarget && typeof interactionTarget === 'object' ) {
			return interactionTarget.value || ''
		}

		return typeof interactionTarget === 'string' ? interactionTarget : ''
	}

	ensureInteractionTarget( moduleId ) {
		if ( ! moduleId ) {
			return ''
		}

		const existingTarget = this.getStoredInteractionTarget( moduleId )
		if ( existingTarget ) {
			return existingTarget
		}

		// Persist the target on the Divi module itself so the same identifier is
		// rendered in both the builder and the frontend output.
		const targetId = generateInteractionTargetId( 10 )
		this.getDiviDataApi()?.dispatch?.( 'divi/edit-post' )?.editModuleAttribute?.( {
			id: moduleId,
			attrName: 'module.decoration.interactionTarget',
			value: targetId,
			caller: 'user',
			subName: false,
		} )
		return targetId
	}

	getSelectableElement( element ) {
		return element?.closest?.( '.et_pb_module, .et_pb_column, .et_pb_column_inner, .et_pb_row, .et_pb_row_inner, .et_pb_section' ) || null
	}

	syncInteractionTargetElement( element, interactionTarget ) {
		if ( ! element || ! interactionTarget ) {
			return
		}

		// Mirror the saved target onto the live builder DOM immediately so picker
		// previews can work before Divi re-renders the module from store state.
		element.setAttribute( 'data-interaction-target', interactionTarget )
	}

	buildTargetFromElement( element ) {
		const targetElement = this.getSelectableElement( element )
		if ( ! targetElement ) {
			return null
		}

		// Resolve the clicked DOM node back to the Divi module record, then map it
		// to the persistent interaction target we expose to the Interactions UI.
		const moduleId = this.getModuleIdFromElement( targetElement )
		const interactionTarget = moduleId
			? this.ensureInteractionTarget( moduleId )
			: ''
		if ( ! interactionTarget ) {
			return null
		}
		this.syncInteractionTargetElement( targetElement, interactionTarget )

		const moduleClass = Array.from( targetElement.classList ).find( className =>
			/^et_pb_(section|row|row_inner|column|column_inner|[a-z0-9_]+)$/i.test( className ) &&
			! /^et_pb_[a-z0-9_]+_(?:\d+|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test( className )
		) || targetElement.tagName?.toLowerCase() || 'divi-element'

		return {
			type: 'selector',
			value: `[data-interaction-target="${ interactionTarget }"]`,
			blockName: moduleClass,
		}
	}

	getCurrentSelectedTarget() {
		return this.buildTargetFromElement( this.selectedElement?.element || null )
	}

	registerSelectionTracking() {
		if ( this.selectionTrackingCleanup ) {
			return this.selectionTrackingCleanup
		}

		let boundDocument = null
		let boundIframe = null
		let observer = null

		const clickHandler = event => {
			const candidate = this.getSelectableElement( event.target )
			if ( candidate ) {
				this.selectedElement = { element: candidate }
			}
		}

		const unbindDocument = () => {
			if ( boundDocument ) {
				boundDocument.removeEventListener( 'click', clickHandler, true )
				boundDocument = null
			}
		}

		const bindDocument = previewDocument => {
			if ( ! previewDocument?.body || boundDocument === previewDocument ) {
				return
			}

			unbindDocument()
			previewDocument.addEventListener( 'click', clickHandler, true )
			boundDocument = previewDocument
		}

		const syncBindings = () => {
			const nextIframe = document.querySelector( 'iframe[src*="app_window=1"]' )
			if ( boundIframe && boundIframe !== nextIframe ) {
				boundIframe.removeEventListener( 'load', syncBindings )
				boundIframe = null
				unbindDocument()
			}

			if ( nextIframe && boundIframe !== nextIframe ) {
				// Re-run the binding step after every iframe reload so selection
				// tracking follows Divi's canvas document as it gets replaced.
				nextIframe.addEventListener( 'load', syncBindings )
				boundIframe = nextIframe
			}

			bindDocument( this.getCanvasDocument() )
		}

		syncBindings()

		// Keep watching for iframe replacement because Divi can recreate the app
		// window during builder navigation without reloading the top document.
		observer = new MutationObserver( syncBindings )
		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} )

		this.selectionTrackingCleanup = () => {
			observer?.disconnect()
			if ( boundIframe ) {
				boundIframe.removeEventListener( 'load', syncBindings )
			}
			unbindDocument()
			boundIframe = null
			this.selectionTrackingCleanup = null
		}

		return this.selectionTrackingCleanup
	}

	startElementPicker( {
		onPick = NOOP,
		onCancel = NOOP,
	} = {} ) {
		const previewDocument = this.getCanvasDocument()
		if ( ! previewDocument ) {
			onCancel()
			return NOOP
		}

		let highlightedElement = null

		const clearHighlight = () => {
			if ( highlightedElement ) {
				highlightedElement.style.outline = highlightedElement.dataset.interactPrevOutline || ''
				highlightedElement.style.outlineOffset = highlightedElement.dataset.interactPrevOutlineOffset || ''
				delete highlightedElement.dataset.interactPrevOutline
				delete highlightedElement.dataset.interactPrevOutlineOffset
			}
			highlightedElement = null
		}

		const mouseMoveHandler = event => {
			const candidate = this.getSelectableElement( event.target )
			if ( candidate === highlightedElement ) {
				return
			}

			clearHighlight()
			if ( candidate ) {
				highlightedElement = candidate
				highlightedElement.dataset.interactPrevOutline = highlightedElement.style.outline || ''
				highlightedElement.dataset.interactPrevOutlineOffset = highlightedElement.style.outlineOffset || ''
				highlightedElement.style.outline = '2px solid #05f'
				highlightedElement.style.outlineOffset = '2px'
			}
		}

		// Capture the target on mousedown so Divi's own click-to-edit behavior
		// does not consume the first interaction before we can resolve it.
		const mouseDownHandler = event => {
			const candidate = this.getSelectableElement( event.target )
			if ( ! candidate ) {
				return
			}

			event.preventDefault()
			event.stopPropagation()
			const target = this.buildTargetFromElement( candidate )
			stop()

			if ( target ) {
				onPick( target )
			} else {
				onCancel()
			}
		}

		const keyHandler = event => {
			if ( event.key === 'Escape' ) {
				stop()
				onCancel()
			}
		}

		const stop = () => {
			clearHighlight()
			previewDocument.removeEventListener( 'mousemove', mouseMoveHandler, true )
			previewDocument.removeEventListener( 'mousedown', mouseDownHandler, true )
			previewDocument.removeEventListener( 'keydown', keyHandler, true )
			document.removeEventListener( 'keydown', keyHandler, true )
		}

		previewDocument.addEventListener( 'mousemove', mouseMoveHandler, true )
		previewDocument.addEventListener( 'mousedown', mouseDownHandler, true )
		previewDocument.addEventListener( 'keydown', keyHandler, true )
		document.addEventListener( 'keydown', keyHandler, true )

		return stop
	}
}

export default DiviInteractionsEditor
