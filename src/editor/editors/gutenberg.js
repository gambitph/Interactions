import IconSVG from '../assets/icon.svg'
import InteractionsApp from '../app'
import InteractionsEditorAbstract from './abstract'

import { registerPlugin } from '@wordpress/plugins'
import { __ } from '@wordpress/i18n'
import { parse } from '@wordpress/blocks'
import {
	useSelect,
	dispatch,
	select,
} from '@wordpress/data'

// Gutenberg editor adapter.
class GutenbergInteractionsEditor extends InteractionsEditorAbstract {
	getEditorMode() {
		return 'gutenberg'
	}

	// Register the Gutenberg sidebar plugin.
	init() {
		if ( this.initialized ) {
			return this
		}

		const GutenbergInteractionsEditorComponent = () => {
			const SideEditorPluginSidebar = window.wp.editSite?.PluginSidebar
			const PostEditorPluginSidebar = window.wp.editPost?.PluginSidebar
			const SideBar = SideEditorPluginSidebar ? SideEditorPluginSidebar
				: PostEditorPluginSidebar ? PostEditorPluginSidebar : null

			const selectedBlockAnchor = useSelect( select => {
				const clientId = select( 'core/block-editor' )?.getSelectedBlockClientId?.()
				return clientId ? select( 'core/block-editor' ).getBlockAttributes( clientId )?.anchor : null
			}, [] )

			if ( ! SideBar ) {
				return null
			}

			return (
				<SideBar
					name="sidebar"
					title={ __( 'Interactions', 'interactions' ) }
					className="interact-sidebar"
					icon={ <IconSVG width="20" height="20" /> }
				>
					<InteractionsApp
						selectedBlockAnchor={ selectedBlockAnchor }
						enablePostPreviewGuard
					/>
				</SideBar>
			)
		}

		registerPlugin( 'interact-editor', {
			render: GutenbergInteractionsEditorComponent,
		} )

		return super.init()
	}

	// Return the Gutenberg editor canvas document.
	getCanvasDocument() {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' )
		return iframe?.contentDocument || document
	}

	// Open the Interactions sidebar in Gutenberg.
	openPanel() {
		if ( dispatch( 'core/edit-post' ) ) {
			return dispatch( 'core/edit-post' ).openGeneralSidebar( 'interact-editor/sidebar' )
		}
		return dispatch( 'core/edit-site' ).openGeneralSidebar( 'interact-editor/sidebar' )
	}

	// Return the currently selected block anchor.
	getSelectedBlockAnchor() {
		const blockEditorStore = select( 'core/block-editor' )
		if ( ! blockEditorStore?.getSelectedBlockClientId ) {
			return null
		}
		const clientId = blockEditorStore.getSelectedBlockClientId()
		return clientId ? blockEditorStore.getBlockAttributes( clientId )?.anchor : null
	}

	// Return the current Gutenberg selection as an interaction target.
	getCurrentSelectedTarget() {
		const blockEditorStore = select( 'core/block-editor' )
		const clientId = blockEditorStore?.getSelectedBlockClientId?.()
		if ( ! clientId ) {
			return null
		}

		const block = blockEditorStore.getBlock?.( clientId )
		if ( ! block ) {
			return null
		}

		const hasAnchorAttribute = !! select( 'core/blocks' ).getBlockType( block.name )?.attributes?.anchor
		if ( hasAnchorAttribute ) {
			return {
				type: 'block',
				value: this.getSelectedBlockAnchor() || '',
				blockName: block.name || '',
				options: '',
			}
		}

		const className = block.attributes?.className?.split( ' ' )?.[ 0 ] || ''
		return {
			type: 'class',
			value: className,
			blockName: block.name || '',
			options: '',
		}
	}

	canInsertPreset( preset ) {
		return !! preset?.serializedBlockExample
	}

	// Insert the preset block tree and return it so target mappings can resolve
	// against the freshly inserted Gutenberg blocks.
	insertPresetContent( preset ) {
		const block = parse( preset?.serializedBlockExample ?? '' )[ 0 ]
		if ( ! block ) {
			return null
		}

		dispatch( 'core/block-editor' )?.insertBlocks?.( block )

		return {
			targetMappingsSource: block,
		}
	}
}

export default GutenbergInteractionsEditor
