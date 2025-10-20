/* eslint-disable no-console */
const ffmpeg = require( 'fluent-ffmpeg' )
const fs = require( 'fs' )
const path = require( 'path' )

const VIDEOS_DIR = path.resolve( __dirname, '../dist/videos' )

async function optimizeVideos() {
	if ( ! fs.existsSync( VIDEOS_DIR ) ) {
		console.log( '📹 No videos directory found, skipping video optimization' )
		return
	}

	const files = fs.readdirSync( VIDEOS_DIR ).filter( file =>
		file.endsWith( '.mp4' ) && ! file.includes( '.optimized.' )
	)

	if ( files.length === 0 ) {
		console.log( '📹 No videos to optimize' )
		return
	}

	console.log( `📹 Optimizing ${ files.length } video(s)...` )

	for ( const file of files ) {
		const inputPath = path.join( VIDEOS_DIR, file )
		const outputPath = path.join( VIDEOS_DIR, file.replace( '.mp4', '.optimized.mp4' ) )

		try {
			await new Promise( ( resolve, reject ) => {
				ffmpeg( inputPath )
					.videoCodec( 'libx264' )
					.noAudio() // Remove audio from the video
					.size( '500x?' ) // 500px width, auto height
					.videoBitrate( '800k' ) // Compress video
					.outputOptions( [
						'-preset',
						'veryslow', // Balance between speed and compression
						'-crf',
						'20', // Constant Rate Factor for quality control
						'-y', // Overwrite output files without asking
					] )
					.on( 'end', () => {
						console.log( `✅ Optimized: ${ file }` )
						// Replace original with optimized version
						fs.unlinkSync( inputPath )
						fs.renameSync( outputPath, inputPath )
						resolve()
					} )
					.on( 'error', err => {
						console.error( `❌ Error optimizing ${ file }:`, err.message )
						reject( err )
					} )
					.save( outputPath )
			} )
		} catch ( error ) {
			console.error( `Failed to optimize ${ file }:`, error.message )
		}
	}

	console.log( '📹 Video optimization complete!' )
}

// Run if called directly
if ( require.main === module ) {
	optimizeVideos().catch( console.error )
}

module.exports = { optimizeVideos }
