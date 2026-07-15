import { test, expect } from 'e2e/test-utils'

test.describe.configure( { timeout: 120000 } )

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

	test( 'Interactions button is visible in the lower right of the Elementor editor', async ( {
		page,
		interactions,
	} ) => {
		await interactions.openElementorEditor( pageId )

		const launcher = interactions.getElementorLauncherButton()

		await expect( launcher ).toBeVisible()
		await expect( launcher ).toHaveText( 'Interactions' )

		const box = await launcher.boundingBox()
		const viewport = page.viewportSize()

		expect( box ).not.toBeNull()
		expect( viewport ).not.toBeNull()
		expect( box.x + box.width ).toBeGreaterThan( viewport.width * 0.5 )
		expect( box.y + box.height ).toBeGreaterThan( viewport.height * 0.5 )
	} )
} )
