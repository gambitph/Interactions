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
}
