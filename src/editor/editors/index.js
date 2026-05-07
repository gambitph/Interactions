import { editorMode } from 'interactions'
import GutenbergInteractionsEditor from './gutenberg'
import ElementorInteractionsEditor from './elementor'

let activeEditor = null

// Create the active editor adapter for the current editor environment.
const createInteractionsEditor = () => {
	return editorMode === 'elementor'
		? new ElementorInteractionsEditor()
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

export const isGutenbergEditor = () => getInteractionsEditor().isGutenberg()

export const getCurrentEditorPostContext = () => getInteractionsEditor().getCurrentPostContext()

export const getSelectedBlockAnchor = () => getInteractionsEditor().getSelectedBlockAnchor()

export const getEditorCanvasDocument = () => getInteractionsEditor().getCanvasDocument()

export const getEditorCanvasElement = () => getInteractionsEditor().getCanvasElement()

export const openInteractionsSidebar = () => getInteractionsEditor().openInteractionsPanel()

export const getCurrentSelectedTarget = () => getInteractionsEditor().getCurrentSelectedTarget()

export const registerElementorSelectionTracking = () => getInteractionsEditor().registerSelectionTracking()

export const startElementorElementPicker = args => getInteractionsEditor().startElementPicker( args )
