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

// Elementor editor adapter.
class ElementorInteractionsEditor extends InteractionsEditorAbstract {
	constructor() {
		super()
		this.selectedElement = null
	}

	getEditorMode() {
		return 'elementor'
	}

	// Mount the Elementor launcher and side panel shell.
	init() {
		if ( this.initialized ) {
			return this
		}

		const mountNodeId = 'interact-elementor-root'
		if ( document.getElementById( mountNodeId ) ) {
			return super.init()
		}

		const ElementorInteractionsEditorComponent = () => {
			const [ isOpen, setIsOpen ] = useState( false )

			useEffect( () => {
				const openHandler = () => setIsOpen( true )
				window.addEventListener( 'interact/open-elementor-sidebar', openHandler )
				return () => window.removeEventListener( 'interact/open-elementor-sidebar', openHandler )
			}, [] )

			return (
				<>
					<Button
						className="interact-elementor-launcher"
						variant="primary"
						icon={ <IconSVG width="18" height="18" /> }
						onClick={ () => setIsOpen( value => ! value ) }
					>
						{ __( 'Interactions', 'interactions' ) }
					</Button>
					{ /* { isOpen && (
						<div
							className="interact-elementor-backdrop"
							onClick={ () => setIsOpen( false ) }
							aria-hidden="true"
						/>
					) } */ }
					<div className={ `interact-elementor-panel${ isOpen ? ' is-open' : '' }` }>
						<div className="interact-elementor-panel__header">
							<div className="interact-elementor-panel__title">
								<IconSVG width="18" height="18" />
								<span>{ __( 'Interactions', 'interactions' ) }</span>
							</div>
							<Button
								className="interact-elementor-panel__close"
								icon="no-alt"
								variant="tertiary"
								label={ __( 'Close Interactions', 'interactions' ) }
								onClick={ () => setIsOpen( false ) }
							/>
						</div>
						<div className="interact-elementor-panel__body">
							<div className="interact-sidebar interact-elementor-sidebar">
								<InteractionsApp enablePostPreviewGuard={ false } />
							</div>
						</div>
					</div>
				</>
			)
		}

		const mountNode = document.createElement( 'div' )
		mountNode.id = mountNodeId
		document.body.appendChild( mountNode )
		this.registerSelectionTracking()
		createRoot( mountNode ).render( <ElementorInteractionsEditorComponent /> )

		return super.init()
	}

	// Return the Elementor preview canvas document.
	getCanvasDocument() {
		const iframe = document.querySelector( '#elementor-preview-iframe' )
		return iframe?.contentDocument || document
	}

	// Open the Interactions sidebar in Elementor.
	openPanel() {
		window.dispatchEvent( new CustomEvent( 'interact/open-elementor-sidebar' ) )
		return null
	}

	// Build an interaction target from a selected Elementor element.
	buildTargetFromElement( element, targetType = 'selector' ) {
		if ( ! element ) {
			return null
		}

		const targetElement = element.closest( '.elementor-element[data-id]' )
		if ( ! targetElement ) {
			return null
		}

		const elementId = targetElement.getAttribute( 'data-id' )
		if ( ! elementId ) {
			return null
		}

		const elementType = targetElement.getAttribute( 'data-element_type' ) || ''
		const widgetType = targetElement.getAttribute( 'data-widget_type' ) || ''
		const label = widgetType || elementType || 'elementor-element'
		const wrapperSelector = `.elementor-element.elementor-element-${ elementId }`
		const classValue = `elementor-element-${ elementId }`
		const targetValue = targetType === 'class'
			? classValue
			: elementType === 'widget'
				? `${ wrapperSelector } > *`
				: wrapperSelector

		return {
			type: targetType,
			value: targetValue,
			blockName: label,
		}
	}

	getHighlightElement( element ) {
		if ( ! element ) {
			return null
		}

		const targetElement = element.closest( '.elementor-element[data-id]' )
		if ( ! targetElement ) {
			return null
		}

		const elementType = targetElement.getAttribute( 'data-element_type' ) || ''
		if ( elementType !== 'widget' ) {
			return targetElement
		}

		return targetElement.firstElementChild || targetElement
	}

	// Return the currently selected Elementor target.
	getCurrentSelectedTarget() {
		return this.buildTargetFromElement( this.selectedElement?.element || null )
	}

	// Track the current Elementor selection from the editor panel.
	registerSelectionTracking() {
		if ( ! window.elementor?.hooks?.addAction ) {
			return NOOP
		}

		const register = action => {
			window.elementor.hooks.addAction( action, ( panel, model, view ) => {
				this.selectedElement = {
					model,
					view,
					element: view?.$el?.get?.( 0 ) || null,
				}
			} )
		}

		[
			'panel/open_editor/section',
			'panel/open_editor/column',
			'panel/open_editor/container',
			'panel/open_editor/widget',
		].forEach( register )

		return NOOP
	}

	// Start an Elementor preview picker for selector or class targets.
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

		// Restore the previously highlighted element back to its original outline.
		const clearHighlight = () => {
			if ( highlightedElement ) {
				highlightedElement.style.outline = highlightedElement.dataset.interactPrevOutline || ''
				highlightedElement.style.outlineOffset = highlightedElement.dataset.interactPrevOutlineOffset || ''
				delete highlightedElement.dataset.interactPrevOutline
				delete highlightedElement.dataset.interactPrevOutlineOffset
			}
			highlightedElement = null
		}

		// Follow the pointer inside the preview and visually mark the current pick candidate.
		const mouseMoveHandler = event => {
			const candidate = event.target.closest( '.elementor-element[data-id]' )
			const highlightCandidate = this.getHighlightElement( candidate )
			if ( highlightCandidate === highlightedElement ) {
				return
			}
			clearHighlight()
			if ( highlightCandidate ) {
				highlightedElement = highlightCandidate
				highlightedElement.dataset.interactPrevOutline = highlightedElement.style.outline || ''
				highlightedElement.dataset.interactPrevOutlineOffset = highlightedElement.style.outlineOffset || ''
				highlightedElement.style.outline = '2px solid #05f'
				highlightedElement.style.outlineOffset = '2px'
			}
		}

		// Convert the clicked Elementor element into an interaction target and stop pick mode.
		const clickHandler = event => {
			const candidate = event.target.closest( '.elementor-element[data-id]' )
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

		// Allow canceling the picker with Escape.
		const keyHandler = event => {
			if ( event.key === 'Escape' ) {
				stop()
				onCancel()
			}
		}

		// Remove all temporary picker listeners and preview highlighting.
		const stop = () => {
			clearHighlight()
			previewDocument.removeEventListener( 'mousemove', mouseMoveHandler, true )
			previewDocument.removeEventListener( 'click', clickHandler, true )
			document.removeEventListener( 'keydown', keyHandler, true )
		}

		previewDocument.addEventListener( 'mousemove', mouseMoveHandler, true )
		previewDocument.addEventListener( 'click', clickHandler, true )
		document.addEventListener( 'keydown', keyHandler, true )

		return stop
	}
}

export default ElementorInteractionsEditor
