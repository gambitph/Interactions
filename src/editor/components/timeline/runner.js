/**
 * The timeline runner that runs the animation when previewing.
 */
import InteractEditorRunner from './class-runner'
import { useRef, useMemo } from '@wordpress/element'
import { cloneDeep } from 'lodash'
import { getBlockClientId } from './with-tracked-anchors'
import { doAction } from '@wordpress/hooks'

// Create the runner.
const runner = new InteractEditorRunner()

// Becuase of the way we're loading the script below, we need to expose the
// runner.
window.InteractRunner = runner

// Load all the action-types, we need these because these contain the action
// configurations.
const actionTypesContext = require.context(
	'../../../action-types/frontend',
	true, // Search recursively.
	/\.js$/
)
actionTypesContext.keys().forEach( actionTypesContext )
doAction( 'interact.action.types.loaded' )

// Load all the interaction-types for the editor. We only need to load stuff for
// the editor.
const interactionTypesEditorContext = require.context(
	'../../../interaction-types/editor',
	true, // Search recursively.
	/\.js$/
)
interactionTypesEditorContext.keys().forEach( interactionTypesEditorContext )
doAction( 'interact.interaction.types.loaded' )

export const useTimelineRunnerRef = ( interaction, actions, timelineIndex ) => {
	const runnerRef = useRef( null )

	// Initialize the runner
	const initialStyles = useMemo( () => {
		// We will need to spawn a new runner for each timeline. Spawning will
		// create a new running with the same configuration.
		if ( ! runnerRef.current ) {
			runnerRef.current = runner.spawn()
		}

		// Just do the actions for the current timeline.
		const isolatedInteraction = cloneDeep( interaction )
		isolatedInteraction.timelines = [ {
			...isolatedInteraction.timelines[ timelineIndex ], // Copy the other timeline settings.
			actions: cloneDeep( actions ),
		} ]

		// This replaces all block anchors with the block's ID. The editor
		// doesn't show block anchors, since it's always in the format of
		// "block-clientId"
		replaceBlockAnchorsForEditor( isolatedInteraction )

		runnerRef.current?.configure( [ isolatedInteraction ] )
		runnerRef.current?.init()

		return runnerRef.current?.getStartingActionStyles() || ''
	}, [ interaction, timelineIndex, actions ] )

	return [ runnerRef, initialStyles ]
}

// Goes through the interaction and replaces all the block anchors with the
// block's ID. This is needed because the editor doesn't show block anchors.
// This mutates the argument.
const replaceBlockAnchorsForEditor = interaction => {
	// Replace the interaction target value with the block's ID.
	if ( interaction.target.type === 'block' ) {
		const clientId = getBlockClientId( interaction.target.value )
		if ( clientId ) {
			interaction.target.value = `block-${ clientId }`
		}
	}

	// Replace the timeline action targets
	interaction.timelines.forEach( ( timeline, timelineIndex ) => {
		timeline.actions.forEach( ( action, actionIdex ) => {
			if ( action.target.type === 'block' ) {
				const clientId = getBlockClientId( action.target.value )
				if ( clientId ) {
					interaction.timelines[ timelineIndex ].actions[ actionIdex ].target.value = `block-${ clientId }`
				}
			}
		} )
	} )

	return interaction
}
