import {
	test as base,
	expect,
} from '@wordpress/e2e-test-utils-playwright'

import { ExtendedRequestUtils } from './requestUtils'
import { InteractionsFixture } from './interactions'
import { ExtendedEditor } from './editor'

const test = base.extend<{
    requestUtils: ExtendedRequestUtils;
	interactions: InteractionsFixture;
	editor: ExtendedEditor;
}>( {
	requestUtils: async ( {}, use ) => {
		const requestUtils = await ExtendedRequestUtils.setup( {
			baseURL: process.env.WP_BASE_URL,
			user: {
				username: process.env.WP_USERNAME,
				password: process.env.WP_PASSWORD,
			},
		} )

		await use( requestUtils )
	},

	interactions: async ( { page }, use ) => {
		await use( new InteractionsFixture( page ) )
	},

	editor: async ( { page }, use ) => {
		await use( new ExtendedEditor( { page } ) )
	},
} )

export { test, expect }
