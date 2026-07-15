import { test, expect } from 'e2e/test-utils'

test.describe( 'Block Editor', () => {
	let pid = null

	test.beforeEach( async ( { editor, admin } ) => {
		await admin.createNewPost( { title: 'Block Editor Test' } )
		await editor.saveDraft()
		const postQuery = new URL( editor.page.url() ).search
		pid = new URLSearchParams( postQuery ).get( 'post' )
	} )

	test.afterEach( async ( { requestUtils } ) => {
		if ( pid ) {
			await requestUtils.deletePost( pid )
		}
	} )

	test( 'Interactions Library button is visible in the top toolbar', async ( {
		interactions,
	} ) => {
		const libraryButton = interactions.getLibraryToolbarButton()

		await expect( libraryButton ).toBeVisible()
		await expect( libraryButton ).toHaveText( 'Interactions' )
	} )

	test( 'Interactions sidebar button is visible in the top toolbar', async ( {
		interactions,
	} ) => {
		const sidebarButton = interactions.getSidebarToolbarButton()

		await expect( sidebarButton ).toBeVisible()
	} )

	test( 'can insert an interaction from the Interaction Library', async ( {
		page,
		editor,
		interactions,
	} ) => {
		test.setTimeout( 60000 )

		const initialBlockCount = await editor.canvas.locator( '[data-type]' ).count()

		// Open the Interactions sidebar first so the app is mounted before the insert event fires.
		await interactions.getSidebarToolbarButton().click()

		// Open the Interaction Library from the top toolbar.
		await interactions.getLibraryToolbarButton().click()
		await expect( interactions.getInteractionLibraryModal() ).toBeVisible()

		// Wait for presets to finish loading.
		const firstFreePreset = interactions.getFirstFreePresetCard()
		await expect( firstFreePreset ).toBeVisible( { timeout: 30000 } )

		// Hover to reveal the Insert button, then click it.
		await firstFreePreset.hover()
		const insertButton = firstFreePreset.getByRole( 'button', { name: 'Insert' } )
		await expect( insertButton ).toBeVisible()
		await insertButton.click()

		// Modal should close after inserting.
		await expect( interactions.getInteractionLibraryModal() ).toBeHidden( { timeout: 15000 } )

		// New blocks should be added to the editor.
		await expect( editor.canvas.locator( '[data-type]' ) ).not.toHaveCount( initialBlockCount, { timeout: 15000 } )
		await expect( editor.canvas.locator( '[data-type]' ).count() ).resolves.toBeGreaterThan( initialBlockCount )

		// Interactions sidebar should show an interaction being edited.
		await expect( page.locator( '.interface-complementary-area' ).filter( { has: interactions.getInteractionsSidebar() } ) ).toBeVisible( { timeout: 15000 } )
		await expect( page.locator( '.interact-interaction-card' ).first() ).toBeVisible( { timeout: 30000 } )
	} )

	test( 'clicking Manage all your interactions navigates to the interactions post list', async ( {
		interactions,
		requestUtils,
	} ) => {
		const interactionKey = await requestUtils.createInteraction()

		try {
			await interactions.openBlockEditorSidebar()

			const managePage = await interactions.clickManageAllInteractionsLink()
			await interactions.expectInteractionsPostList( managePage )

			await managePage.close()
		} finally {
			await requestUtils.deleteInteraction( interactionKey )
		}
	} )
} )
