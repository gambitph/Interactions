import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'

import { __ } from '@wordpress/i18n'
import { Button } from '@wordpress/components'
import {
	createRoot,
	useEffect,
	useState,
} from '@wordpress/element'

const NOOP = () => {}

// Divi editor adapter for the initial Visual Builder integration milestone.
class DiviInteractionsEditor extends InteractionsEditorAbstract {
	constructor() {
		super()
		this.selectedElement = null
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

	getCanvasDocument() {
		const iframe = document.querySelector( 'iframe[src*="app_window=1"]' )
		return iframe?.contentDocument || null
	}

	getCanvasWindow() {
		const iframe = document.querySelector( 'iframe[src*="app_window=1"]' )
		return iframe?.contentWindow || null
	}

	getSelectableElement( element ) {
		return element?.closest?.( '.et_pb_module, .et_pb_column, .et_pb_column_inner, .et_pb_row, .et_pb_row_inner, .et_pb_section' ) || null
	}

	getElementInstanceClass( element ) {
		if ( ! element?.classList ) {
			return ''
		}

		return Array.from( element.classList ).find( className =>
			/^et_pb_[a-z0-9_]+_(?:\d+|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test( className )
		) || ''
	}

	getElementBaseClass( element ) {
		const instanceClass = this.getElementInstanceClass( element )
		if ( ! instanceClass ) {
			return ''
		}

		return instanceClass
			.replace( /_(?:\d+|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i, '' )
	}

	getModuleOrderIndex( element ) {
		const moduleId = element?.dataset?.id
		if ( ! moduleId ) {
			return null
		}

		const canvasWindow = this.getCanvasWindow()
		const select = canvasWindow?.wp?.data?.select || canvasWindow?.divi?.data?.select
		const editPostStore = select?.( 'divi/edit-post' )
		const module = editPostStore?.getModule?.( moduleId )

		if ( ! module ) {
			return null
		}

		return module.orderIndex ?? module.get?.( 'orderIndex' ) ?? null
	}

	getDomOrderIndex( element ) {
		const targetElement = this.getSelectableElement( element )
		const baseClass = this.getElementBaseClass( targetElement )
		const previewDocument = this.getCanvasDocument()
		if ( ! targetElement || ! baseClass || ! previewDocument ) {
			return null
		}

		const matches = Array.from( previewDocument.querySelectorAll( `.${ baseClass }` ) )
			.filter( match => this.getSelectableElement( match ) === match )
		const index = matches.indexOf( targetElement )

		return index === -1 ? null : index
	}

	getFrontendOrderClass( element ) {
		const baseClass = this.getElementBaseClass( element )
		const orderIndex = this.getDomOrderIndex( element ) ?? this.getModuleOrderIndex( element )
		if ( ! baseClass || orderIndex === null || typeof orderIndex === 'undefined' ) {
			return ''
		}

		return `${ baseClass }_${ orderIndex }`
	}

	buildTargetFromElement( element, targetType = 'selector' ) {
		const targetElement = this.getSelectableElement( element )
		if ( ! targetElement ) {
			return null
		}

		const orderClass = this.getFrontendOrderClass( targetElement ) || this.getElementInstanceClass( targetElement )
		if ( ! orderClass ) {
			return null
		}

		const moduleClass = Array.from( targetElement.classList ).find( className =>
			/^et_pb_(section|row|row_inner|column|column_inner|[a-z0-9_]+)$/i.test( className ) &&
			! /^et_pb_[a-z0-9_]+_(?:\d+|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test( className )
		) || targetElement.tagName?.toLowerCase() || 'divi-element'

		return {
			type: targetType,
			value: targetType === 'class' ? orderClass : `.${ orderClass }`,
			blockName: moduleClass,
		}
	}

	getCurrentSelectedTarget() {
		return this.buildTargetFromElement( this.selectedElement?.element || null )
	}

	registerSelectionTracking() {
		let isBound = false
		let observer = null
		let observerTimeoutId = null

		const bindListeners = () => {
			if ( isBound ) {
				return true
			}

			const previewDocument = this.getCanvasDocument()
			if ( ! previewDocument?.body ) {
				return false
			}

			previewDocument.addEventListener( 'click', event => {
				const candidate = this.getSelectableElement( event.target )
				if ( candidate ) {
					this.selectedElement = { element: candidate }
				}
			}, true )

			isBound = true
			return true
		}

		if ( ! bindListeners() ) {
			const stopObserving = () => {
				observer?.disconnect()
				observer = null

				if ( observerTimeoutId ) {
					window.clearTimeout( observerTimeoutId )
					observerTimeoutId = null
				}
			}

			observer = new MutationObserver( () => {
				if ( bindListeners() ) {
					stopObserving()
				}
			} )

			observer.observe( document.body, {
				childList: true,
				subtree: true,
			} )

			observerTimeoutId = window.setTimeout( () => {
				stopObserving()
			}, 10000 )
		}

		return () => {
			observer?.disconnect()

			if ( observerTimeoutId ) {
				window.clearTimeout( observerTimeoutId )
			}
		}
	}

	startElementPicker( {
		targetType = 'selector',
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

		const clickHandler = event => {
			const candidate = this.getSelectableElement( event.target )
			if ( ! candidate ) {
				return
			}

			event.preventDefault()
			event.stopPropagation()
			const target = this.buildTargetFromElement( candidate, targetType )
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
			previewDocument.removeEventListener( 'click', clickHandler, true )
			previewDocument.removeEventListener( 'keydown', keyHandler, true )
			document.removeEventListener( 'keydown', keyHandler, true )
		}

		previewDocument.addEventListener( 'mousemove', mouseMoveHandler, true )
		previewDocument.addEventListener( 'click', clickHandler, true )
		previewDocument.addEventListener( 'keydown', keyHandler, true )
		document.addEventListener( 'keydown', keyHandler, true )

		return stop
	}
}

export default DiviInteractionsEditor
