import { editorMode } from 'interactions'
import GutenbergInteractionsEditor from './gutenberg'
import ElementorInteractionsEditor from './elementor'
import BricksInteractionsEditor from './bricks'

let activeEditor = null

// Create the active editor adapter for the current editor environment.
const createInteractionsEditor = () => {
	return editorMode === 'elementor'
		? new ElementorInteractionsEditor()
		: editorMode === 'bricks'
			? new BricksInteractionsEditor()
			: new GutenbergInteractionsEditor()
}

// Return the memoized editor adapter instance.
export const getInteractionsEditor = () => {
	if ( ! activeEditor ) {
		activeEditor = createInteractionsEditor()
	}
	return activeEditor
}

export const getEditorMode = () => getInteractionsEditor().getEditorMode()

export const isElementorEditor = () => getInteractionsEditor().isElementor()

export const isBricksEditor = () => getInteractionsEditor().isBricks()

export const isGutenbergEditor = () => getInteractionsEditor().isGutenberg()

export const isBuilderEditor = () => getInteractionsEditor().isBuilder()

export const getCurrentEditorPostContext = () => getInteractionsEditor().getCurrentPostContext()

export const getSelectedBlockAnchor = () => getInteractionsEditor().getSelectedBlockAnchor()

export const getEditorCanvasDocument = () => getInteractionsEditor().getCanvasDocument()

export const getEditorCanvasElement = () => getInteractionsEditor().getCanvasElement()

export const openInteractionsSidebar = () => getInteractionsEditor().openInteractionsPanel()

export const getCurrentSelectedTarget = () => getInteractionsEditor().getCurrentSelectedTarget()

export const registerEditorSelectionTracking = () => getInteractionsEditor().registerSelectionTracking()

export const startEditorElementPicker = args => getInteractionsEditor().startElementPicker( args )
