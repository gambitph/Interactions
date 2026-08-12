import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'
import { InteractionLibraryRoot } from '../interaction-library'
import { normalizeElementorExample } from '../interaction-library/elementor-example'
import {
	getPresetBuilderExample,
	getPresetBuilderTargetRefs,
} from '../interaction-library/preset-schema'

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

		const editor = this
		const ElementorInteractionsEditorComponent = () => {
			const [ isOpen, setIsOpen ] = useState( false )

			const openPanel = () => {
				editor.ensureBuilderEditorStyles().then( () => {
					setIsOpen( true )
				} )
			}

			useEffect( () => {
				const openHandler = () => openPanel()
				window.addEventListener( 'interact/open-elementor-sidebar', openHandler )
				return () => window.removeEventListener( 'interact/open-elementor-sidebar', openHandler )
			}, [] )

			useEffect( () => {
				document.body.classList.toggle( 'interact-elementor-panel-open', isOpen )

				return () => {
					document.body.classList.remove( 'interact-elementor-panel-open' )
				}
			}, [ isOpen ] )

			return (
				<>
					<Button
						className={ `interact-elementor-launcher${ isOpen ? ' is-hidden' : '' }` }
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
					<div className={ `interact-pagebuilder-panel interact-elementor-panel${ isOpen ? ' is-open' : '' }` }>
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
							<div className="interact-sidebar interact-pagebuilder-sidebar">
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
		mountNode.className = 'interact-builder-root interact-elementor-root'
		document.body.appendChild( mountNode )
		document.body.classList.add( 'interact-builder-editor' )
		document.body.classList.add( 'interact-elementor-editor' )
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

	// Some Elementor widgets render through editor-only wrappers, so the
	// interaction target needs to point at the frontend child instead.
	getWidgetContentTargetSelector( targetElement, elementId ) {
		if ( ! targetElement || ! elementId ) {
			return ''
		}

		// Special case for Elementor button widgets
		const widgetType = targetElement.getAttribute( 'data-widget_type' ) || ''
		if ( widgetType.startsWith( 'button.' ) ) {
			return `.elementor-element.elementor-element-${ elementId } a.elementor-button`
		}
		if ( widgetType.startsWith( 'icon.' ) ) {
			return `.elementor-element.elementor-element-${ elementId } .elementor-icon`
		}

		const interactiveDescendant = targetElement.querySelector( `[data-interaction-id="${ elementId }"]` )
		if ( interactiveDescendant ) {
			return `[data-interaction-id="${ elementId }"]`
		}

		return ''
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
		const example = getPresetBuilderExample( preset, 'elementor' )
		return Array.isArray( example ) && example.length > 0
	}

	// Top-level preset containers belong at the document root. Widget presets
	// still use the nearest selected container and become siblings of widgets.
	getInsertContainer( insertAtRoot = false ) {
		let container = insertAtRoot
			? window.elementor?.getPreviewContainer?.() ||
				window.elementor?.getPreviewView?.()?.getContainer?.() ||
				null
			: this.selectedElement?.view?.getContainer?.() ||
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

	// Read the minimum metadata we need from either the live preview DOM or the
	// inserted container model. Insert mode can resolve before the preview node
	// exists, so we cannot depend on the DOM alone here.
	getContainerMeta( container ) {
		const resolvedContainer = container?.lookup?.() || container
		const model = resolvedContainer?.model || resolvedContainer
		const element = resolvedContainer?.view?.$el?.get?.( 0 ) || null
		const targetElement = element?.closest?.( '.elementor-element[data-id]' ) || null

		return {
			element,
			targetElement,
			elementId:
				targetElement?.getAttribute?.( 'data-id' ) ||
				model?.get?.( 'id' ) ||
				model?.id ||
				'',
			elementType:
				targetElement?.getAttribute?.( 'data-element_type' ) ||
				model?.get?.( 'elType' ) ||
				'',
			widgetType:
				targetElement?.getAttribute?.( 'data-widget_type' ) ||
				model?.get?.( 'widgetType' ) ||
				'',
		}
	}

	// Build a normal interaction target from an inserted Elementor container.
	// This powers both the default target for simple presets and path-based
	// targetRef resolution for complex presets.
	buildTargetFromContainer( container, targetType = 'selector' ) {
		const {
			element,
			elementId,
			elementType,
			widgetType,
		} = this.getContainerMeta( container )

		if ( element ) {
			return this.buildTargetFromElement( element, targetType )
		}

		if ( ! elementId ) {
			return null
		}

		const wrapperSelector = `.elementor-element.elementor-element-${ elementId }`
		const targetTargetType = targetType === 'class' ? 'class' : 'selector'
		const targetValue = targetTargetType === 'class'
			? `elementor-element-${ elementId }`
			: widgetType.startsWith( 'button.' )
				? `${ wrapperSelector } a.elementor-button`
				: widgetType.startsWith( 'icon.' )
					? `${ wrapperSelector } .elementor-icon`
					: wrapperSelector

		return {
			type: targetTargetType,
			value: targetValue,
			blockName: widgetType || elementType || 'elementor-element',
		}
	}

	getWrapperSelectorFromContainer( container ) {
		const { elementId } = this.getContainerMeta( container )

		return elementId ? `.elementor-element.elementor-element-${ elementId }` : ''
	}

	// Scope a preset's child selector to the inserted widget wrapper so
	// `targetRefs` can point at nested frontend elements such as buttons.
	buildChildSelectorTarget( container, targetConfig = {} ) {
		const baseTarget = this.buildTargetFromContainer( container )
		if ( ! baseTarget ) {
			return null
		}

		const childSelector = targetConfig.value || ''
		const wrapperSelector = this.getWrapperSelectorFromContainer( container ) || baseTarget.value
		const scopedSelector = childSelector
			? `${ wrapperSelector } ${ childSelector }`
			: wrapperSelector

		return {
			type: targetConfig.type || 'selector',
			value: scopedSelector,
			blockName: targetConfig.blockName || baseTarget.blockName,
			options: targetConfig.options || '',
		}
	}

	// Follow a preset path through Elementor's runtime tree. Preset paths mirror
	// the JSON example, while pasted children live in Backbone `elements`
	// collections rather than directly on the returned Container objects.
	resolveInsertedContainerPath( inserted, targetPath ) {
		if ( targetPath.length === 0 ) {
			return this.getFirstInsertedContainer( inserted )
		}

		let currentValue = Array.isArray( inserted ) ? inserted : [ inserted ]
		for ( const key of targetPath ) {
			const resolvedValue = currentValue?.lookup?.() || currentValue

			if ( key === 'elements' ) {
				const model = resolvedValue?.model || resolvedValue
				currentValue = model?.get?.( 'elements' ) || resolvedValue?.elements
			} else if ( typeof key === 'number' && typeof resolvedValue?.at === 'function' ) {
				currentValue = resolvedValue.at( key )
			} else {
				currentValue = resolvedValue?.[ key ]
			}

			if ( ! currentValue ) {
				return null
			}
		}

		return currentValue?.lookup?.() || currentValue
	}

	// Resolve a semantic targetRef from the preset into a runtime interaction
	// target by following the inserted tree path returned by Elementor.
	resolveInsertedTargetMapping( mapping = {}, inserted, elementorTargetRefs = {} ) {
		const targetRefConfig = elementorTargetRefs?.[ mapping.targetRef ]
		const targetPath = Array.isArray( targetRefConfig )
			? targetRefConfig
			: targetRefConfig?.path

		if ( ! Array.isArray( targetPath ) ) {
			return null
		}

		const container = this.resolveInsertedContainerPath( inserted, targetPath )
		if ( ! container ) {
			return null
		}

		if ( targetRefConfig?.target ) {
			return this.buildChildSelectorTarget( container, targetRefConfig.target )
		}

		return this.buildTargetFromContainer( container )
	}

	// Insert a preset into Elementor through its paste command so the builder
	// can create any required wrapper containers automatically. The returned
	// context is later consumed by the shared library flow to resolve either:
	// 1. explicit targetRefs/targetMappings, or
	// 2. a default target for simple presets with only `elementorExample`.
	async insertPresetContent( preset ) {
		if ( ! this.canInsertPreset( preset ) || ! window.$e?.run ) {
			return null
		}

		const normalizedExample = normalizeElementorExample( getPresetBuilderExample( preset, 'elementor' ) )
		if ( normalizedExample.length === 0 ) {
			return null
		}

		const insertAtRoot = normalizedExample.every( element => element.elType === 'container' )
		const container = this.getInsertContainer( insertAtRoot )
		if ( ! container ) {
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

		// The first inserted container becomes the fallback target for presets
		// that do not declare target mappings.
		const firstInsertedContainer = this.getFirstInsertedContainer( inserted )
		if ( ! firstInsertedContainer ) {
			return null
		}
		const defaultTarget = this.buildTargetFromContainer( firstInsertedContainer )

		window.$e.internal?.( 'document/save/set-is-modified', { status: true } )
		const targetRefs = getPresetBuilderTargetRefs( preset, 'elementor' )

		return {
			targetMappingsSource: inserted,
			// Explicit mappings must resolve their own node; falling back here
			// silently applies interactions to the inserted root instead.
			resolveTargetMappingTarget: mapping => this.resolveInsertedTargetMapping(
				mapping,
				inserted,
				targetRefs
			),
			defaultTarget,
			targetRefs,
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
