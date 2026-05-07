import { editorMode } from 'interactions'

if ( editorMode !== 'elementor' ) {
	require( './block-toolbar-button' )
	require( './top-toolbar-button' )
	require( './block-highlight' )
	require( './block-select' )
}
