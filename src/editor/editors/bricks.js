import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'

import { __ } from '@wordpress/i18n'
import { Button } from '@wordpress/components'
import {
	useEffect,
	useState,
	createRoot,
} from '@wordpress/element'

const NOOP = () => {}

class BricksInteractionsEditor extends InteractionsEditorAbstract {
	constructor() {
		super()
		this.selectedElement = null
	}

	getEditorMode() {
		return 'bricks'
	}

	init() {
		if ( this.initialized ) {
			return this
		}

		// Bricks loads the editor script in both the builder document and the
		// preview iframe. Only mount the Interactions UI in the top-level shell.
		if ( window.frameElement ) {
			return super.init()
		}

		const mountNodeId = 'interact-bricks-root'
		if ( document.getElementById( mountNodeId ) ) {
			return super.init()
		}

		const editor = this
		const BricksInteractionsEditorComponent = () => {
			const [ isOpen, setIsOpen ] = useState( false )

			const openPanel = () => {
				editor.ensureBuilderEditorStyles().then( () => {
					setIsOpen( true )
				} )
			}

			useEffect( () => {
				const openHandler = () => openPanel()
				window.addEventListener( 'interact/open-bricks-sidebar', openHandler )
				return () => window.removeEventListener( 'interact/open-bricks-sidebar', openHandler )
			}, [] )

			return (
				<>
					<Button
						className={ `interact-bricks-launcher${ isOpen ? ' is-hidden' : '' }` }
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
					<div className={ `interact-bricks-panel${ isOpen ? ' is-open' : '' }` }>
						<div className="interact-bricks-panel__header">
							<div className="interact-bricks-panel__title">
								<IconSVG width="18" height="18" />
								<span>{ __( 'Interactions', 'interactions' ) }</span>
							</div>
							<Button
								className="interact-bricks-panel__close"
								icon="no-alt"
								variant="tertiary"
								label={ __( 'Close Interactions', 'interactions' ) }
								onClick={ () => setIsOpen( false ) }
							/>
						</div>
						<div className="interact-bricks-panel__body">
							<div className="interact-sidebar interact-bricks-sidebar">
								<InteractionsApp enablePostPreviewGuard={ false } />
							</div>
						</div>
					</div>
				</>
			)
		}

		const mountNode = document.createElement( 'div' )
		mountNode.id = mountNodeId
		mountNode.className = 'interact-builder-root interact-bricks-root'
		document.body.appendChild( mountNode )
		document.body.classList.add( 'interact-builder-editor' )
		document.body.classList.add( 'interact-bricks-editor' )
		this.registerSelectionTracking()
		createRoot( mountNode ).render( <BricksInteractionsEditorComponent /> )

		return super.init()
	}

	getCanvasDocument() {
		const iframe = document.querySelector( '#bricks-builder-iframe' )
		return iframe?.contentDocument || null
	}

	openPanel() {
		window.dispatchEvent( new CustomEvent( 'interact/open-bricks-sidebar' ) )
		return null
	}

	getSelectedElementId( element ) {
		if ( ! element ) {
			return ''
		}

		if ( element.dataset?.id ) {
			return element.dataset.id
		}

		const bricksNode = element.closest( '[data-id]' )
		if ( bricksNode?.dataset?.id ) {
			return bricksNode.dataset.id
		}

		const frontendNode = element.closest( '[id^="brxe-"]' )
		if ( frontendNode?.id ) {
			return frontendNode.id.replace( /^brxe-/, '' )
		}

		return ''
	}

	buildTargetFromElement( element ) {
		const elementId = this.getSelectedElementId( element )
		if ( ! elementId ) {
			return null
		}

		const label = element?.dataset?.elementType || element?.tagName?.toLowerCase() || 'bricks-element'

		return {
			type: 'selector',
			value: `#brxe-${ elementId }`,
			blockName: label,
		}
	}

	getCurrentSelectedTarget() {
		if ( ! this.selectedElement ) {
			return null
		}

		return this.buildTargetFromElement( this.selectedElement.element )
	}

	registerSelectionTracking() {
		let isBound = false
		let observer = null

		const handleSelection = element => {
			this.selectedElement = {
				element,
			}
		}

		const bindListeners = () => {
			if ( isBound ) {
				return true
			}

			const previewDocument = this.getCanvasDocument()
			if ( ! previewDocument?.body ) {
				return false
			}

			previewDocument.addEventListener( 'click', event => {
				const candidate = event.target.closest( '[data-id], [id^="brxe-"]' )
				if ( candidate ) {
					handleSelection( candidate )
				}
			}, true )

			const structurePanel = document.querySelector( '#bricks-structure' )
			if ( structurePanel ) {
				structurePanel.addEventListener( 'click', event => {
					const candidate = event.target.closest( '[data-id]' )
					if ( candidate ) {
						handleSelection( candidate )
					}
				}, true )
			}

			isBound = true
			return true
		}

		if ( ! bindListeners() ) {
			observer = new MutationObserver( () => {
				if ( bindListeners() ) {
					observer?.disconnect()
				}
			} )

			observer.observe( document.body, {
				childList: true,
				subtree: true,
			} )
		}

		return () => observer?.disconnect()
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

		const getCandidate = element => element?.closest?.( '[data-id], [id^="brxe-"]' ) || null

		const mouseMoveHandler = event => {
			const candidate = getCandidate( event.target )
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
			const candidate = getCandidate( event.target )
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

export default BricksInteractionsEditor
