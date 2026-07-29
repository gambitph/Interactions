/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableTabsChangeTab: {
		initAction: action => {
			action.initActionFunction( () => {
				const tabNumber = action.getValue( 'tab' ) || 1

				action.getTargets().forEach( el => {
					const tabs = el.tabs

					// Do not proceed if the target is not a Stackable Tabs
					if ( ! tabs ) {
						return
					}

					tabs.changeTab( Number( tabNumber ) )
				} )
			} )
		},
	},
} )
