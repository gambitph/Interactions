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

	getElementorPanel() {
		return this.page.locator( '.interact-elementor-panel' )
	}

	async dismissElementorOnboarding() {
		const dialogs = this.page.locator( '.elementor-dialog, .e-route-panel' )

		if ( await dialogs.first().isVisible().catch( () => false ) ) {
			const closeButton = dialogs.first().locator(
				'button.dialog-close-button, button[aria-label="Close"]'
			).first()

			if ( await closeButton.isVisible().catch( () => false ) ) {
				await closeButton.click().catch( () => {} )
			}
		}
	}

	async openElementorEditor( postId: string ) {
		await this.page.goto( `/wp-admin/post.php?post=${ postId }&action=elementor`, {
			waitUntil: 'domcontentloaded',
			timeout: 60000,
		} )

		// Elementor's editor keeps loading assets and may never reach "load".
		// Wait for the editor shell instead of window.elementor.
		try {
			await this.page.waitForURL( /action=elementor/, { timeout: 15000 } )
		} catch ( error ) {
			throw new Error(
				`Expected Elementor editor URL but landed on ${ this.page.url() }. ` +
				'Is Elementor installed and activated? Set ELEMENTOR_SLUG in .env if needed.'
			)
		}

		await this.page.locator( '#elementor-panel' ).waitFor( {
			state: 'visible',
			timeout: 90000,
		} )
		await this.page.locator( '#elementor-preview-iframe' ).waitFor( {
			state: 'attached',
			timeout: 90000,
		} )
		await this.page.waitForResponse(
			response => response.url().includes( '/dist/editor.js' ) && response.ok(),
			{ timeout: 90000 },
		).catch( () => {} )
		await this.dismissElementorOnboarding()
		await this.getElementorLauncherButton().waitFor( {
			state: 'visible',
			timeout: 90000,
		} )
	}
}
