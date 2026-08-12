import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'
import { InteractionLibraryRoot } from '../interaction-library'
import {
	getPresetBuilderExample,
	getPresetBuilderTargetRefs,
} from '../interaction-library/preset-schema'

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
const DIVI_CONTAINER_MODULE_NAMES = [
	'divi/root',
	'divi/section',
	'divi/row',
	'divi/row-inner',
	'divi/column',
	'divi/column-inner',
	'divi/group',
	'divi/group-carousel',
]
const DIVI_DIRECT_INSERT_MODULE_NAMES = [
	'divi/root',
	'divi/column',
	'divi/column-inner',
	'divi/group',
	'divi/group-carousel',
]

// Read a nested value from a plain object using an array path.
const getValueAtPath = ( object, path = [], defaultValue ) => {
	let currentValue = object

	for ( const key of path ) {
		if ( currentValue === null || typeof currentValue !== 'object' || ! ( key in currentValue ) ) {
			return defaultValue
		}

		currentValue = currentValue[ key ]
	}

	return currentValue === undefined ? defaultValue : currentValue
}

// Clone a plain object/array tree and replace one nested path.
const setValueAtPath = ( object, path = [], value ) => {
	if ( path.length === 0 ) {
		return value
	}

	const [ key, ...restPath ] = path
	const currentBranch =
		object !== null && typeof object === 'object'
			? object
			: ( typeof key === 'number' ? [] : {} )
	const nextBranch = setValueAtPath( currentBranch?.[ key ], restPath, value )

	if ( Array.isArray( currentBranch ) ) {
		const clonedArray = [ ...currentBranch ]
		clonedArray[ key ] = nextBranch
		return clonedArray
	}

	return {
		...currentBranch,
		[ key ]: nextBranch,
	}
}

// Mimic the small getIn/setIn API Divi's copy reducer expects from moduleObjects.
const createDiviModuleObjects = moduleObjects => {
	const wrappedObjects = { ...moduleObjects }

	Object.defineProperties( wrappedObjects, {
		getIn: {
			enumerable: false,
			value: ( path, defaultValue ) => getValueAtPath( wrappedObjects, path, defaultValue ),
		},
		setIn: {
			enumerable: false,
			value: ( path, value ) => createDiviModuleObjects( setValueAtPath( wrappedObjects, path, value ) ),
		},
	} )

	return wrappedObjects
}

// Normalize a Divi preset tree into the flat module map used by Divi content state.
const buildDiviPresetPayload = nodes => {
	const parentId = 'interact-preset-root'
	const moduleObjects = {
		[ parentId ]: {
			id: parentId,
			name: 'divi/root',
			parent: '',
			children: [],
			props: {
				attrs: {},
			},
		},
	}
	const rootIds = []

	const registerNode = ( node, currentParentId ) => {
		if ( ! node?.name ) {
			return null
		}

		const nodeId = node.id || `interact-${ generateInteractionTargetId() }`
		moduleObjects[ nodeId ] = {
			id: nodeId,
			name: node.name,
			parent: currentParentId,
			children: [],
			props: {
				attrs: node.props || {},
			},
		}
		moduleObjects[ currentParentId ].children.push( nodeId )

		for ( const childNode of node.children || [] ) {
			registerNode( childNode, nodeId )
		}

		return nodeId
	}

	for ( const node of nodes ) {
		const rootId = registerNode( node, parentId )
		if ( rootId ) {
			rootIds.push( rootId )
		}
	}

	return {
		parentId,
		rootIds,
		moduleObjects: createDiviModuleObjects( moduleObjects ),
	}
}

// Convert Divi immutable/plain child collections into a simple array.
const toArray = value => {
	if ( Array.isArray( value ) ) {
		return value
	}

	if ( value?.asMutable ) {
		return value.asMutable( { deep: false } )
	}

	return []
}

// Wait for Divi to reflect a newly inserted child in the content tree.
const waitForDiviInsertedModule = async ( {
	editPostSelect,
	layout = '',
	targetParentId = '',
	insertTarget = {},
	previousChildren = [],
	timeoutMs = 2000,
	intervalMs = 50,
} ) => {
	const startedAt = Date.now()

	while ( Date.now() - startedAt < timeoutMs ) {
		const content = editPostSelect?.getContent?.( layout || undefined )
		const parentChildren = toArray(
			content?.getIn?.( [ targetParentId, 'children' ], [] )
		)
		const insertedChildren = parentChildren.filter(
			childId => ! previousChildren.includes( childId )
		)
		const insertedId =
			insertedChildren[ 0 ] ||
			editPostSelect?.getNewlyInsertedModuleId?.( {
				content,
				id: insertTarget.anchorId,
				position: insertTarget.position,
			} )

		if ( insertedId ) {
			return {
				insertedId,
				content,
				parentChildren,
				insertedChildren,
			}
		}

		await new Promise( resolve => window.setTimeout( resolve, intervalMs ) )
	}

	return {
		insertedId: null,
		content: editPostSelect?.getContent?.( layout || undefined ) || null,
		parentChildren: [],
		insertedChildren: [],
	}
}

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

	// Resolve the nearest Divi container that can directly accept inserted modules.
	getDirectInsertElement( element ) {
		const targetElement = this.getSelectableElement( element )
		if ( ! targetElement ) {
			return null
		}

		const targetModuleId = this.getModuleIdFromElement( targetElement )
		const targetModuleName = this.getModuleName( targetModuleId )
		if ( DIVI_DIRECT_INSERT_MODULE_NAMES.includes( targetModuleName ) ) {
			return targetElement
		}

	return targetElement.querySelector?.(
		'.et_pb_column[data-id], .et_pb_column_inner[data-id], .et_pb_group[data-id], .et_pb_group_carousel[data-id]'
	) || null
	}

	// Some Divi modules render their real interactive target inside the wrapper,
	// so mirror the picker target onto that child element in the builder preview.
	getTargetPreviewElement( element ) {
		if ( ! element ) {
			return null
		}

		const moduleId = this.getModuleIdFromElement( element )
		const moduleName = this.getModuleName( moduleId )

		if ( moduleName === 'divi/button' ) {
			return element.querySelector( 'a' ) || element
		}

		return element
	}

	syncInteractionTargetElement( element, interactionTarget ) {
		if ( ! element || ! interactionTarget ) {
			return
		}

		// Mirror the saved target onto the live builder DOM immediately so picker
		// previews can work before Divi re-renders the module from store state.
		this.getTargetPreviewElement( element )?.setAttribute( 'data-interaction-target', interactionTarget )
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

	canInsertPreset( preset ) {
		const example = getPresetBuilderExample( preset, 'divi' )
		return Array.isArray( example ) ? example.length > 0 : !! example
	}

	// Return the builder module name for a Divi content node.
	getModuleName( moduleId ) {
		if ( ! moduleId ) {
			return ''
		}

		const moduleName = this.getDiviDataApi()?.select?.( 'divi/edit-post' )?.getModuleName?.( moduleId ) || ''
		return typeof moduleName === 'string' ? moduleName : ''
	}

	// Build a standard Interactions target from a persisted Divi module ID.
	buildTargetFromModuleId( moduleId ) {
		if ( ! moduleId ) {
			return null
		}

		const interactionTarget = this.ensureInteractionTarget( moduleId )
		if ( ! interactionTarget ) {
			return null
		}

		const targetElement = this.getCanvasDocument()?.querySelector(
			`[data-id="${ moduleId }"], [data-wrapper-id="${ moduleId }"], [data-module-id="${ moduleId }"]`
		)
		this.syncInteractionTargetElement( targetElement, interactionTarget )

		return {
			type: 'selector',
			value: `[data-interaction-target="${ interactionTarget }"]`,
			blockName: this.getModuleName( moduleId ) || 'divi-element',
		}
	}

	// Decide where a new Divi module should be inserted relative to the current selection.
	getInsertTarget() {
		const selectedInsertElement = this.getDirectInsertElement( this.selectedElement?.element || null )
		const selectedInsertModuleId = this.getModuleIdFromElement( selectedInsertElement )
		if ( selectedInsertModuleId ) {
			return {
				anchorId: selectedInsertModuleId,
				position: 'inside',
			}
		}

		const selectedModuleId = this.getModuleIdFromElement( this.selectedElement?.element || null )
		if ( selectedModuleId ) {
			return {
				anchorId: selectedModuleId,
				position: DIVI_CONTAINER_MODULE_NAMES.includes( this.getModuleName( selectedModuleId ) )
					? 'inside'
					: 'after',
			}
		}

		const previewDocument = this.getCanvasDocument()
		const preferredContainer = previewDocument?.querySelector(
			'.et_pb_column[data-id], .et_pb_column_inner[data-id], .et_pb_group[data-id], .et_pb_group_carousel[data-id]'
		)
		const preferredContainerId = this.getModuleIdFromElement( preferredContainer )

		if ( preferredContainerId ) {
			return {
				anchorId: preferredContainerId,
				position: 'inside',
			}
		}

		return {
			anchorId: 'root',
			position: 'inside',
		}
	}

	// Normalize top-level Divi preset examples to an array for sequential insertion.
	getDiviPresetNodes( preset ) {
		const example = getPresetBuilderExample( preset, 'divi' )
		if ( Array.isArray( example ) ) {
			return example
		}

		return example ? [ example ] : []
	}

	// Resolve target refs by mapping the preset source ID to the inserted Divi module ID.
	resolveInsertedTargetMapping( mapping = {}, inserted, diviTargetRefs = {} ) {
		const sourceId = diviTargetRefs?.[ mapping.targetRef ]?.id
		if ( ! sourceId ) {
			return null
		}

		const insertedId = inserted?.sourceIdToInsertedId?.[ sourceId ]
		if ( ! insertedId ) {
			return null
		}

		return this.buildTargetFromModuleId( insertedId )
	}

	// Collect the source subtree IDs in the same pre-order Divi clone keeps them.
	getPresetStructureIds( moduleObjects, moduleId ) {
		if ( ! moduleId ) {
			return []
		}

		const moduleChildren = moduleObjects?.getIn?.( [ moduleId, 'children' ], [] ) || []
		return [
			moduleId,
			...moduleChildren.flatMap( childId =>
				this.getPresetStructureIds( moduleObjects, childId )
			),
		]
	}

	// Read the module appearance limits Divi uses while cloning payload nodes.
	getModuleAppearanceSettings( rootIds = [], moduleObjects ) {
		const moduleLibrarySelect = this.getDiviDataApi()?.select?.( 'divi/module-library' )

		return rootIds.reduce( ( appearanceSettings, rootId ) => {
			for ( const moduleId of this.getPresetStructureIds( moduleObjects, rootId ) ) {
				const moduleName = moduleObjects?.getIn?.( [ moduleId, 'name' ], '' )
				if ( ! moduleName || appearanceSettings[ moduleName ] ) {
					continue
				}

				const moduleDefinition = moduleLibrarySelect?.getModule?.( moduleName )
				if ( moduleDefinition?.appearance ) {
					appearanceSettings[ moduleName ] = moduleDefinition.appearance
				}
			}

			return appearanceSettings
		}, {} )
	}

	// Insert a preset into Divi by replaying its flat module payload through Divi's copy actions.
	async insertPresetContent( preset ) {
		// eslint-disable-next-line no-console
		console.warn( 'Divi insertPresetContent:start', {
			presetId: preset?.id,
			presetName: preset?.name,
		} )
		if ( ! this.canInsertPreset( preset ) ) {
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:cannot-insert', {
				presetId: preset?.id,
			} )
			return null
		}

		const presetNodes = this.getDiviPresetNodes( preset )
		if ( presetNodes.length === 0 ) {
			return null
		}

		const editPostSelect = this.getDiviDataApi()?.select?.( 'divi/edit-post' )
		const layout = editPostSelect?.getActiveLayout?.() || ''
		const insertTarget = this.getInsertTarget()
		if ( ! insertTarget?.anchorId ) {
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:no-anchor', {
				presetId: preset?.id,
			} )
			return null
		}

		const editPostApi = this.getDiviDataApi()
		const editPostDispatch = editPostApi?.dispatch?.( 'divi/edit-post' )
		const moduleSelect = editPostApi?.select?.( 'divi/module' )
		const payload = buildDiviPresetPayload( presetNodes )
		const targetParentId = insertTarget.position === 'inside'
			? insertTarget.anchorId
			: editPostSelect?.getParentModuleId?.( insertTarget.anchorId )
		const insertSimpleNodeWithAddModule = async () => {
			const simpleNode = presetNodes[ 0 ]
			const contentBeforeAddModule = editPostSelect.getContent( layout || undefined )
			const childrenBeforeAddModule = toArray(
				contentBeforeAddModule?.getIn?.( [ targetParentId, 'children' ], [] )
			)
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:addModule', {
				presetId: preset?.id,
				insertTarget,
				layout,
				moduleName: simpleNode.name,
			} )
			editPostDispatch.addModule(
				insertTarget.anchorId,
				simpleNode.name,
				simpleNode.props || {},
				insertTarget.position,
				'',
				'user',
				layout || undefined
			)

			const {
				insertedId,
				parentChildren,
				insertedChildren,
			} = await waitForDiviInsertedModule( {
				editPostSelect,
				layout,
				targetParentId,
				insertTarget,
				previousChildren: childrenBeforeAddModule,
			} )
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:addModule-result', {
				presetId: preset?.id,
				insertedId,
				childrenBeforeAddModule,
				parentChildren,
				insertedChildren,
			} )
			const defaultTarget = insertedId
				? this.buildTargetFromModuleId( insertedId )
				: null

			if ( ! defaultTarget ) {
				// eslint-disable-next-line no-console
				console.warn( 'Divi insertPresetContent:addModule-no-target', {
					presetId: preset?.id,
					insertedId,
				} )
				return null
			}

			const inserted = {
				rootIds: [ insertedId ],
				sourceIdToInsertedId: simpleNode.id
					? { [ simpleNode.id ]: insertedId }
					: {},
			}
			const targetRefs = getPresetBuilderTargetRefs( preset, 'divi' )

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

		if (
			payload.rootIds.length === 0 ||
			! targetParentId ||
			! editPostSelect?.getContent
		) {
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:missing-prerequisite', {
				presetId: preset?.id,
				rootIds: payload.rootIds,
				targetParentId,
				hasGetContent: !! editPostSelect?.getContent,
			} )
			return null
		}

		if (
			presetNodes.length === 1 &&
			! presetNodes[ 0 ]?.children?.length &&
			editPostDispatch?.addModule &&
			(
				! editPostDispatch?.copyModuleFromPayload ||
				! editPostDispatch?.copyModulesFromPayload
			)
		) {
			return insertSimpleNodeWithAddModule()
		}

		if (
			! editPostDispatch?.copyModuleFromPayload ||
			! editPostDispatch?.copyModulesFromPayload
		) {
			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:no-copy-api', {
				presetId: preset?.id,
			} )
			return null
		}

		const contentBeforeInsert = editPostSelect.getContent( layout || undefined )
		const childrenBeforeInsert = toArray(
			contentBeforeInsert?.getIn?.( [ targetParentId, 'children' ], [] )
		)
		const copyParams = {
			payload,
			position: insertTarget.position,
			targetId: insertTarget.anchorId,
			moduleAppearanceSettings: this.getModuleAppearanceSettings(
				payload.rootIds,
				payload.moduleObjects
			),
			themeBuilderLayout: layout || undefined,
			moduleCount: moduleSelect?.getModuleCount?.(),
			caller: 'user',
		}
		// eslint-disable-next-line no-console
		console.warn( 'Divi insertPresetContent:copyModules', {
			presetId: preset?.id,
			insertTarget,
			layout,
			rootIds: payload.rootIds,
			targetParentId,
		} )

		if ( payload.rootIds.length === 1 ) {
			const firstRootId = payload.rootIds[ 0 ]
			const firstModuleName = payload.moduleObjects.getIn( [ firstRootId, 'name' ], '' )
			editPostDispatch.copyModuleFromPayload( copyParams, firstModuleName )
		} else {
			editPostDispatch.copyModulesFromPayload( copyParams )
		}

		const {
			insertedId: firstInsertedId,
			parentChildren: childrenAfterInsert,
			insertedChildren: insertedRootIds,
		} = await waitForDiviInsertedModule( {
			editPostSelect,
			layout,
			targetParentId,
			insertTarget,
			previousChildren: childrenBeforeInsert,
		} )
		// eslint-disable-next-line no-console
		console.warn( 'Divi insertPresetContent:copyModules-result', {
			presetId: preset?.id,
			childrenBeforeInsert,
			childrenAfterInsert,
			insertedRootIds,
			firstInsertedId,
		} )
		const defaultTarget = firstInsertedId
			? this.buildTargetFromModuleId( firstInsertedId )
			: null
		if ( ! defaultTarget ) {
			if (
				presetNodes.length === 1 &&
				! presetNodes[ 0 ]?.children?.length &&
				editPostDispatch?.addModule
			) {
				// eslint-disable-next-line no-console
				console.warn( 'Divi insertPresetContent:copyModules-fallback-addModule', {
					presetId: preset?.id,
				} )
				return insertSimpleNodeWithAddModule()
			}

			// eslint-disable-next-line no-console
			console.warn( 'Divi insertPresetContent:copyModules-no-target', {
				presetId: preset?.id,
				firstInsertedId,
				insertedRootIds,
			} )
			return null
		}

		const inserted = {
			rootIds: insertedRootIds,
			sourceIdToInsertedId: {},
		}

		payload.rootIds.forEach( ( sourceRootId, rootIndex ) => {
			const insertedRootId = insertedRootIds[ rootIndex ]
			if ( ! insertedRootId ) {
				return
			}

			const sourceStructureIds = this.getPresetStructureIds(
				payload.moduleObjects,
				sourceRootId
			)
			const insertedStructureIds = editPostSelect.getModuleStructureIds?.( insertedRootId ) || []

			sourceStructureIds.forEach( ( sourceId, structureIndex ) => {
				const insertedId = insertedStructureIds[ structureIndex ]
				if ( insertedId ) {
					inserted.sourceIdToInsertedId[ sourceId ] = insertedId
				}
			} )
		} )

		const targetRefs = getPresetBuilderTargetRefs( preset, 'divi' )
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
