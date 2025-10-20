import { srcUrl } from 'interactions'
import { applyFilters } from '@wordpress/hooks'
import { camelCase } from 'lodash'

/**
 * Internal dependencies
 */

// Dynamically import all .mp4 files from the assets folder
const videoContext = require.context( './assets', false, /\.mp4$/ )

// Create VIDEOS object by processing all imported videos
const VIDEOS = {}
videoContext.keys().forEach( key => {
	// Extract filename from the key (e.g., './filename.mp4' -> 'filename.mp4')
	const filename = key.replace( './', '' )
	// Remove .mp4 extension and convert to camelCase
	const videoName = camelCase( filename.replace( '.mp4', '' ) )
	// Store the imported video
	VIDEOS[ videoName ] = videoContext( key ).default
} )
// Allow the premium to add more videos.
applyFilters( 'interact.interactionLibrary.videos', VIDEOS )

const getVideoUrl = id => {
	const video = VIDEOS[ id ] || ''
	if ( ! video ) {
		return ''
	}
	return `${ srcUrl }/${ video }`
}

export default getVideoUrl
