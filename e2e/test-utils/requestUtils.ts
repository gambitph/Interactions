import { request as playwrightRequest } from '@playwright/test'
import { RequestUtils as BaseRequestUtils } from '@wordpress/e2e-test-utils-playwright'

class ExtendedRequestUtils extends BaseRequestUtils {
	static async setup( options: {
		baseURL?: string;
		user?: { username: string; password: string };
		storageStatePath?: string;
	} = {} ) {
		const {
			baseURL = process.env.WP_BASE_URL,
			user,
			storageStatePath,
		} = options

		let storageState
		if ( storageStatePath ) {
			const fs = await import( 'fs/promises' )
			const path = await import( 'path' )
			await fs.mkdir( path.dirname( storageStatePath ), { recursive: true } )
			try {
				storageState = JSON.parse( await fs.readFile( storageStatePath, 'utf-8' ) )
			} catch ( error ) {
				if ( ! ( error instanceof Error && 'code' in error && error.code === 'ENOENT' ) ) {
					throw error
				}
			}
		}

		const requestContext = await playwrightRequest.newContext( {
			baseURL,
			ignoreHTTPSErrors: true,
			storageState: storageState && {
				cookies: storageState.cookies,
				origins: [],
			},
		} )

		return new this( requestContext, {
			user,
			storageState,
			storageStatePath,
			baseURL,
		} )
	}

	getActivePlugins = async function() {
		const plugins : { [key: string]: any }[] = await this.rest( {
			path: '/wp/v2/plugins',
		} )
		// eslint-disable-next-line no-console
		console.info( 'plugins installed:', plugins.map( plugin => plugin.plugin ), '\n' )
		const activePlugins = plugins.filter( plugin => plugin.status === 'active' ).reduce( ( pluginsMap, plugin ) => {
			pluginsMap[ plugin.plugin ] = plugin.plugin
			return pluginsMap
		}, {} )

		return activePlugins
	}

	deactivatePlugin = async function( slug: string ) {
		try {
			await this.rest( {
				method: 'PUT',
				path: `/wp/v2/plugins/${ slug }`,
				data: { status: 'inactive' },
			} )
		} catch ( error ) {
			throw new Error( `Cannot deactivate ${ slug }: ${ error.message }` )
		}
	}

	activatePlugin = async function( slug: string ) {
		try {
			await this.rest( {
				method: 'PUT',
				path: `/wp/v2/plugins/${ slug }`,
				data: { status: 'active' },
			} )
		} catch ( error ) {
			throw new Error( `Cannot activate ${ slug }: ${ error.message }` )
		}
	}

	deletePost = async function( pid: string, postType: string = 'posts' ) {
		await this.rest( {
			method: 'DELETE',
			path: `/wp/v2/${ postType }/${ pid }`,
			params: {
				force: true,
			},
		} )
	}

	createPage = async function( title: string ) {
		const page = await this.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: {
				title,
				status: 'draft',
			},
		} )

		return String( page.id )
	}

	createInteraction = async function( title = 'E2E Test Interaction' ) {
		const key = `interaction_e2e_${ Date.now() }`
		const data = JSON.stringify( {
			key,
			title,
			active: true,
			type: 'click',
			target: {
				type: 'block',
				value: '',
			},
			timelines: [
				{
					loop: false,
					onceOnly: false,
					alternate: false,
					reset: false,
					reverse: false,
					actions: [],
				},
			],
			options: {},
			locations: [
				[
					{
						param: 'all',
						operator: '==',
						value: '',
					},
				],
			],
		} )

		await this.rest( {
			method: 'POST',
			path: '/interact/v1/update_interaction',
			data: { data },
		} )

		return key
	}

	deleteInteraction = async function( key: string ) {
		await this.rest( {
			method: 'POST',
			path: '/interact/v1/delete_interaction',
			data: { key },
		} )
	}
}

export { ExtendedRequestUtils }
