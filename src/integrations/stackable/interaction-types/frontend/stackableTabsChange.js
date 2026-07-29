/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	stackableTabsChange: {
		initTimeline: interaction => {
			const tab = interaction.getOption( 'tab', '' )

			let timeline = null
			const handler = event => {
				const activeTab = event.detail?.activeTab
				// If a tab number is provided, trigger when the tabs block changes into that tab,
				// otherwise, trigger on every tab change.
				if ( tab === '' || Number( tab ) === activeTab ) {
					timeline?.destroy( false )

					timeline = interaction.createTimelineInstance( 0 )
					timeline?.play()
				}
			}

			const el = interaction.getCurrentTrigger()

			// Do not proceed if the target is not a Stackable Tabs
			if ( el.classList?.contains( 'wp-block-stackable-tabs' ) ) {
				el.addEventListener( 'stackable-tabs-change', handler )

				return () => {
					timeline?.destroy()
					el.removeEventListener( 'stackable-tabs-change', handler )
				}
			}
		},
	},
} )
