import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'
import {
	normalizeElementorExample,
	serializeElementorExample,
	logNormalizedElementorExample,
} from '../interaction-library/elementor-example'

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
						className={ `interact-elementor-launcher${ isOpen ? ' is-hidden' : '' }` }
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
		mountNode.className = 'interact-builder-root interact-elementor-root'
		document.body.appendChild( mountNode )
		document.body.classList.add( 'interact-builder-editor' )
		document.body.classList.add( 'interact-elementor-editor' )
		window.interactElementorExample = {
			normalize: normalizeElementorExample,
			serialize: serializeElementorExample,
			log: logNormalizedElementorExample,
		}
		this.registerSelectionTracking()
		createRoot( mountNode ).render( <ElementorInteractionsEditorComponent /> )

		return super.init()
	}

	// Return the Elementor preview canvas document.
	getCanvasDocument() {
		const iframe = document.querySelector( '#elementor-preview-iframe' )
		return iframe?.contentDocument || null
	}

	// Open the Interactions sidebar in Elementor.
	openPanel() {
		window.dispatchEvent( new CustomEvent( 'interact/open-elementor-sidebar' ) )
		return null
	}

	getWidgetContentTargetSelector( targetElement, elementId ) {
		if ( ! targetElement || ! elementId ) {
			return ''
		}

		const interactiveDescendant = targetElement.querySelector( `[data-interaction-id="${ elementId }"]` )
		if ( interactiveDescendant ) {
			return `[data-interaction-id="${ elementId }"]`
		}

		return ''
	}

	buildTargetFromContainer( container, targetType = 'selector' ) {
		const resolvedContainer = container?.lookup?.() || container
		const element = resolvedContainer?.view?.$el?.get?.( 0 ) || null
		return this.buildTargetFromElement( element, targetType )
	}

	// Build a child selector target relative to an inserted Elementor widget.
	buildChildSelectorTarget( container, targetConfig = {} ) {
		const baseTarget = this.buildTargetFromContainer( container )
		if ( ! baseTarget ) {
			return null
		}

		return {
			type: targetConfig.type || 'selector',
			value: targetConfig.value || '',
			blockName: targetConfig.blockName || baseTarget.blockName,
			options: targetConfig.options || 'children',
		}
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
		const widgetContentSelector = elementType === 'widget'
			? this.getWidgetContentTargetSelector( targetElement, elementId )
			: ''
		const targetTargetType = targetType === 'class' && widgetContentSelector
			? 'selector'
			: targetType
		const targetValue = targetTargetType === 'class'
			? classValue
			: elementType === 'widget'
				? widgetContentSelector || wrapperSelector
				: wrapperSelector

		return {
			type: targetTargetType,
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

	canInsertPreset( preset ) {
		return Array.isArray( preset?.elementorExample ) && preset.elementorExample.length > 0
	}

	getInsertContainer() {
		let container =
			this.selectedElement?.view?.getContainer?.() ||
			window.elementor?.getCurrentElement?.()?.getContainer?.() ||
			window.elementor?.getPreviewContainer?.() ||
			window.elementor?.getPreviewView?.()?.getContainer?.() ||
			null

		container = container?.lookup?.() || container
		if ( ! container ) {
			return null
		}

		const elementType = container.model?.get?.( 'elType' ) || ''
		if ( elementType === 'widget' ) {
			return container.parent || null
		}

		return container
	}

	getFirstInsertedContainer( inserted ) {
		if ( Array.isArray( inserted ) ) {
			for ( const item of inserted ) {
				const firstInsertedContainer = this.getFirstInsertedContainer( item )
				if ( firstInsertedContainer ) {
					return firstInsertedContainer
				}
			}
			return null
		}

		return inserted?.lookup?.() || inserted || null
	}

	// Find an inserted Elementor preview element by its data-id.
	getInsertedElementById( elementId ) {
		if ( ! elementId ) {
			return null
		}

		return this.getCanvasDocument()?.querySelector( `.elementor-element[data-id="${ elementId }"]` ) || null
	}

	// Resolve an inserted Elementor target ref into a standard interaction target.
	resolveInsertedTargetMapping( mapping = {}, inserted, elementorTargetRefs = {} ) {
		const targetRefConfig = elementorTargetRefs?.[ mapping.targetRef ]
		const elementId = targetRefConfig?.id
		if ( elementId ) {
			const element = this.getInsertedElementById( elementId )
			if ( ! element ) {
				return null
			}

			if ( targetRefConfig?.target ) {
				return this.buildChildSelectorTarget( { view: { $el: { get: () => element } } }, targetRefConfig.target )
			}

			return this.buildTargetFromElement( element )
		}

		const targetPath = Array.isArray( targetRefConfig )
			? targetRefConfig
			: targetRefConfig?.path
		if ( ! Array.isArray( targetPath ) ) {
			return null
		}

		const container = targetPath.reduce( ( currentValue, key ) => currentValue?.[ key ], inserted )
		if ( ! container ) {
			return null
		}

		if ( targetRefConfig?.target ) {
			return this.buildChildSelectorTarget( container, targetRefConfig.target )
		}

		return this.buildTargetFromContainer( container )
	}

	// Insert a preset into Elementor through its paste command so the builder
	// can create any required wrapper containers automatically.
	async insertPresetContent( preset ) {
		if ( ! this.canInsertPreset( preset ) || ! window.$e ) {
			return null
		}

		const container = this.getInsertContainer()
		if ( ! container ) {
			return null
		}

		const normalizedExample = normalizeElementorExample( preset.elementorExample )
		if ( normalizedExample.length === 0 ) {
			return null
		}

		const inserted = await window.$e.run( 'document/elements/paste', {
			container,
			rebuild: true,
			storageType: 'json',
			data: JSON.stringify( {
				type: 'elementor',
				elements: normalizedExample,
			} ),
			options: {
				at: container.view?.collection?.length,
			},
		} )

		const firstInsertedContainer = this.getFirstInsertedContainer( inserted )
		if ( ! firstInsertedContainer ) {
			return null
		}

		window.$e.internal?.( 'document/save/set-is-modified', { status: true } )

		return {
			targetMappingsSource: inserted,
			resolveTargetMappingTarget: mapping => this.resolveInsertedTargetMapping(
				mapping,
				inserted,
				preset.elementorTargetRefs
			),
			defaultTarget: this.buildTargetFromContainer( firstInsertedContainer ),
		}
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

		const actions = [
			'panel/open_editor/section',
			'panel/open_editor/column',
			'panel/open_editor/container',
			'panel/open_editor/widget',
		]
		actions.forEach( register )

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

export default ElementorInteractionsEditor
