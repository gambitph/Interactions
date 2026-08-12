import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'
import { InteractionLibraryRoot } from '../interaction-library'
import { cloneBricksExample } from '../interaction-library/bricks-example'
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
import { currentPostId } from 'interactions'

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
					<div className={ `interact-pagebuilder-panel interact-bricks-panel${ isOpen ? ' is-open' : '' }` }>
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

		if ( typeof element.id === 'string' && element.id.startsWith( 'brxe-' ) ) {
			return element.id.replace( /^brxe-/, '' )
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

	// Read the localized Bricks builder payload from the main window.
	getBricksBootData() {
		const dataScript = document.querySelector( '#bricks-builder-js-extra' )
		const scriptContent = dataScript?.textContent || ''
		const match = scriptContent.match( /var\s+bricksData\s*=\s*(\{[\s\S]*\});/ )

		if ( ! match ) {
			return null
		}

		try {
			return JSON.parse( match[ 1 ] )
		} catch ( error ) {
			return null
		}
	}

	// Resolve the current Bricks builder post ID with a localized fallback.
	getBuilderPostId() {
		const bootData = this.getBricksBootData()
		return Number( bootData?.postId ) || Number( currentPostId ) || 0
	}

	// Map the active Bricks template type to the saved data area we need.
	getBuilderArea() {
		const templateType = this.getBricksBootData()?.loadData?.templateType || 'content'
		return [ 'header', 'footer' ].includes( templateType ) ? templateType : 'content'
	}

	// Run a Bricks AJAX action using the same nonce and endpoint as the builder.
	async runBricksAjaxAction( action, data = {} ) {
		const bootData = this.getBricksBootData()
		const ajaxUrl = bootData?.ajaxUrl
		const nonce = bootData?.nonce

		if ( ! ajaxUrl || ! nonce ) {
			return null
		}

		const formData = new window.FormData()
		formData.append( 'action', action )
		formData.append( 'nonce', nonce )

		Object.entries( data ).forEach( ( [ key, value ] ) => {
			if ( value === undefined || value === null ) {
				return
			}

			formData.append(
				key,
				typeof value === 'string' ? value : JSON.stringify( value )
			)
		} )

		const response = await window.fetch( ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: formData,
		} )

		return response.json()
	}

	// Load the current saved Bricks elements for the active builder area.
	async getBuilderElements( postId, area ) {
		const response = await this.runBricksAjaxAction( 'bricks_get_partial_builder_data', {
			postId,
		} )
		const elements = response?.success ? response?.data?.[ area ] : null
		return Array.isArray( elements ) ? elements : []
	}

	// Persist a full Bricks element array through the builder save endpoint.
	async saveBuilderElements( postId, area, elements ) {
		const templateType = this.getBricksBootData()?.loadData?.templateType || 'content'

		return this.runBricksAjaxAction( 'bricks_save_post', {
			postId,
			templateType,
			[ area ]: elements,
		} )
	}

	// Ask Bricks to render the updated builder area so the preview can refresh in place.
	async renderBuilderElements( postId, area, elements ) {
		return this.runBricksAjaxAction( 'bricks_render_data', {
			postId,
			area,
			elements,
			'bricks-is-builder': 1,
		} )
	}

	// Replace the preview markup with freshly rendered Bricks HTML after a preset insert.
	async refreshBuilderPreview( postId, area, elements ) {
		const previewDocument = this.getCanvasDocument()
		const previewRoot = previewDocument?.querySelector( '#brx-content' )
		const bootData = window.bricksData || this.getBricksBootData()

		if ( bootData?.loadData ) {
			bootData.loadData[ area ] = structuredClone( elements )
		}

		if ( ! previewDocument || ! previewRoot ) {
			return
		}

		const response = await this.renderBuilderElements( postId, area, elements )
		const renderedHtml = response?.success ? response?.data?.html : ''

		if ( ! renderedHtml ) {
			return
		}

		previewRoot.innerHTML = renderedHtml
	}

	// Merge inserted preset elements into the current Bricks flat element list.
	insertBricksElements( currentElements = [], insertedElements = [], rootElementIds = [] ) {
		const nextElements = currentElements.map( element => structuredClone( element ) )
		const selectedElementId = this.getSelectedElementId( this.selectedElement?.element || null )
		const insertedRoots = insertedElements.filter( element => rootElementIds.includes( element.id ) )
		const selectedElement = selectedElementId
			? nextElements.find( element => element.id === selectedElementId )
			: null

		if ( selectedElement && Array.isArray( selectedElement.children ) ) {
			selectedElement.children = [
				...selectedElement.children,
				...rootElementIds,
			]
			insertedRoots.forEach( element => {
				element.parent = selectedElement.id
			} )
		} else if ( selectedElement?.parent ) {
			const parentElement = nextElements.find( element => element.id === selectedElement.parent )

			if ( parentElement && Array.isArray( parentElement.children ) ) {
				const selectedIndex = parentElement.children.indexOf( selectedElement.id )
				if ( selectedIndex === -1 ) {
					parentElement.children.push( ...rootElementIds )
				} else {
					parentElement.children.splice( selectedIndex + 1, 0, ...rootElementIds )
				}
				insertedRoots.forEach( element => {
					element.parent = parentElement.id
				} )
			} else {
				nextElements.push( ...insertedElements )
				return nextElements
			}
		} else if ( selectedElement ) {
			const selectedIndex = nextElements.findIndex( element => element.id === selectedElement.id )
			nextElements.splice( selectedIndex + 1, 0, ...insertedElements )
			return nextElements
		}

		nextElements.push( ...insertedElements )
		return nextElements
	}

	// Resolve a Bricks target ref by mapping a preset source ID to the new ID.
	resolveInsertedTargetMapping( mapping = {}, inserted, bricksTargetRefs = {} ) {
		const targetRefConfig = bricksTargetRefs?.[ mapping.targetRef ]
		const sourceId = targetRefConfig?.id
		if ( ! sourceId ) {
			return null
		}

		const insertedElementId = inserted?.sourceIdToInsertedId?.[ sourceId ]
		if ( ! insertedElementId ) {
			return null
		}

		return this.buildTargetFromElement( {
			id: `brxe-${ insertedElementId }`,
		} )
	}

	canInsertPreset( preset ) {
		const example = getPresetBuilderExample( preset, 'bricks' )
		return Array.isArray( example ) ? example.length > 0 : !! example
	}

	// Insert a preset into Bricks by merging it into the saved builder data.
	async insertPresetContent( preset ) {
		if ( ! this.canInsertPreset( preset ) ) {
			return null
		}

		const postId = this.getBuilderPostId()
		const area = this.getBuilderArea()
		if ( ! postId ) {
			return null
		}

		const currentElements = await this.getBuilderElements( postId, area )
		const inserted = cloneBricksExample( getPresetBuilderExample( preset, 'bricks' ) )
		const mergedElements = this.insertBricksElements(
			currentElements,
			inserted.elements,
			inserted.rootElementIds
		)

		const response = await this.saveBuilderElements( postId, area, mergedElements )
		if ( ! response?.success ) {
			return null
		}

		await this.refreshBuilderPreview( postId, area, mergedElements )

		const firstInsertedRootId = inserted.rootElementIds[ 0 ]
		const defaultTarget = firstInsertedRootId
			? this.buildTargetFromElement( { id: `brxe-${ firstInsertedRootId }` } )
			: null
		const targetRefs = getPresetBuilderTargetRefs( preset, 'bricks' )

		return {
			targetMappingsSource: inserted,
			resolveTargetMappingTarget: mapping => this.resolveInsertedTargetMapping(
				mapping,
				inserted,
				targetRefs
			) || defaultTarget,
			defaultTarget,
			targetRefs,
		}
	}

	registerSelectionTracking() {
		let isBound = false
		let observer = null
		let observerTimeoutId = null

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

			// Bricks should expose the preview iframe quickly. If it doesn't,
			// stop watching the whole builder DOM for the rest of the session.
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
