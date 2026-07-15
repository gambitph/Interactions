import { Page } from '@playwright/test'

export class InteractionsFixture {
	page: Page;

	constructor( page: Page ) {
		this.page = page
	}

	getLibraryToolbarButton() {
		return this.page.locator( '.interact-add-interaction-button-wrapper .ugb-insert-library-button' )
	}

	getSidebarToolbarButton() {
		return this.page.locator( 'button[aria-controls="interact-editor:sidebar"]' )
	}

	getInteractionLibraryModal() {
		return this.page.locator( '.interact-interaction-library-modal' )
	}

	getInteractionsSidebar() {
		return this.page.locator( '.interact-sidebar' )
	}

	getFirstFreePresetCard() {
		return this.page
			.locator( '.interact-interaction-library__select__preset-card:not(.interact-premium-preset)' )
			.first()
	}

	getElementorLauncherButton() {
		return this.page.locator( '.interact-elementor-launcher' )
	}

	async dismissElementorOnboarding() {
		const closeButtons = [
			this.page.getByRole( 'button', { name: 'Close' } ),
			this.page.locator( '.dialog-close-button' ),
			this.page.locator( '[aria-label="Close"]' ),
		]

		for ( const button of closeButtons ) {
			if ( await button.first().isVisible().catch( () => false ) ) {
				await button.first().click().catch( () => {} )
			}
		}
	}

	async openElementorEditor( postId: string ) {
		await this.page.goto( `/wp-admin/post.php?post=${ postId }&action=elementor` )
		await this.page.waitForFunction( () => window.elementor !== undefined, {
			timeout: 60000,
		} )
		await this.page.locator( '#elementor-preview-iframe' ).waitFor( {
			state: 'attached',
			timeout: 60000,
		} )
		await this.dismissElementorOnboarding()
		await this.getElementorLauncherButton().waitFor( {
			state: 'visible',
			timeout: 60000,
		} )
	}
}
