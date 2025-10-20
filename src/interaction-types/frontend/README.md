# Interaction Type frontend script

Each interaction type needs its own frontend script. This contains the configuration
for the interaction in the frontend.

In the backend, **time-based** timelines are only "played" in preview mode, so the respective interaction script is not loaded in the editor. 

In the backend, **percentage-based** timelines found in the `../editor` folder are loaded.

# Usage

The `interaction` object passed is an instance of `src/frontend/scripts/class-interaction.js`

```js
/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	click: {
		initTimeline: interaction => {
			// Gets an interaction option. 2nd argument is the default value if unset.
			const value = interaction.getOption( 'optionName', false )

			let timeline = null
			const handler = ev => {
				// Destroy existing timeline if there is one.
				timeline?.destroy( false )

				// Create and play the interaction timeline (index 0).
				timeline = interaction.createTimelineInstance( 0 )
				timeline?.play()
			}

			// Add our handler that will start the interaction.
			const trigger = interaction.getCurrentTrigger()
			trigger.addEventListener( 'click', handler )

			// Return a function that can reset and remove the interaction.
			return () => {
				timeline?.destroy()
				trigger.removeEventListener( 'click', handler )
			}
		},
	},
} )

```
