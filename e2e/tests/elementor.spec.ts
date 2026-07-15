import { test, expect } from 'e2e/test-utils'

test.describe.configure( { timeout: 180000, retries: 1 } )

test.describe( 'Elementor Editor', () => {
	let pageId = null

	test.beforeEach( async ( { requestUtils } ) => {
		pageId = await requestUtils.createPage( 'Elementor Editor Test' )
	} )

	test.afterEach( async ( { requestUtils } ) => {
		if ( pageId ) {
			await requestUtils.deletePost( pageId, 'pages' )
		}
	} )

	test( 'Interactions button is available and opens the Interactions sidebar', async ( {
		page,
		interactions,
	} ) => {
		await interactions.openElementorEditor( pageId )

		const launcher = interactions.getElementorLauncherButton()
		const panel = interactions.getElementorPanel()

		await expect( launcher ).toBeVisible()
		await expect( launcher ).toHaveText( 'Interactions' )

		const box = await launcher.boundingBox()
		const viewport = page.viewportSize()

		expect( box ).not.toBeNull()
		expect( viewport ).not.toBeNull()
		expect( box.x + box.width ).toBeGreaterThan( viewport.width * 0.5 )
		expect( box.y + box.height ).toBeGreaterThan( viewport.height * 0.5 )

		await expect( panel ).not.toHaveClass( /is-open/ )
		await launcher.click()

		await expect( panel ).toHaveClass( /is-open/ )
		await expect( interactions.getInteractionsSidebar() ).toBeVisible()
		await expect( panel.locator( '.interact-pagebuilder-panel__title' ) ).toContainText( 'Interactions' )
	} )

	test( 'clicking Manage all your interactions navigates to the interactions post list', async ( {
		interactions,
		requestUtils,
	} ) => {
		const interactionKey = await requestUtils.createInteraction()

		try {
			await interactions.openElementorEditor( pageId )
			await interactions.openElementorSidebar()

			const managePage = await interactions.clickManageAllInteractionsLink()
			await interactions.expectInteractionsPostList( managePage )

			await managePage.close()
		} finally {
			await requestUtils.deleteInteraction( interactionKey )
		}
	} )
} )
