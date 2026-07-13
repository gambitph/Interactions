import { editorMode } from 'interactions'

if ( editorMode === 'gutenberg' ) {
	require( './block-toolbar-button' )
	require( './top-toolbar-button' )
	require( './block-highlight' )
	require( './block-select' )
}
