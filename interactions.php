<?php
/**
 * Plugin Name: Interactions
 * Plugin URI: https://wpinteractions.com/
 * Description: Add animations and interactivity to your blocks. Choose from ready-made effects like scroll & hover in the Interactions Library, or build your own.
 * Author: Gambit Technologies, Inc
 * Author URI: http://gambit.ph
 * License: GPLv2 or later
 * Text Domain: interactions
 * Version: 1.3.0
 *
 * @fs_premium_only /freemius.php, /freemius/
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

defined( 'INTERACT_BUILD' ) || define( 'INTERACT_BUILD', 'free' );
defined( 'INTERACT_VERSION' ) || define( 'INTERACT_VERSION', '1.3.0' );
defined( 'INTERACT_FILE' ) || define( 'INTERACT_FILE', __FILE__ );

/**
 * Plugin activation hook — handles version check and migration
 */
if ( ! function_exists( 'interact_on_activation' ) ) {
	function interact_on_activation() {
		$saved_version = get_option( 'interact_plugin_version' );

		// Run migration if version not set or outdated
		if ( ! $saved_version || version_compare( $saved_version, INTERACT_VERSION, '<' ) ) {
			do_action( 'interact/on_plugin_update', $saved_version, INTERACT_VERSION );
		}
		update_option( 'interact_plugin_version', INTERACT_VERSION );
	}
}
register_activation_hook( __FILE__, 'interact_on_activation' );

if ( INTERACT_BUILD === 'premium' ) {
	/**
	 * Premium initialize code.
	 */
	if ( file_exists( plugin_dir_path( __FILE__ ) . 'pro__premium_only/index.php' ) ) {
		require_once( plugin_dir_path( __FILE__ ) . 'pro__premium_only/index.php' );
	}
}

require_once( plugin_dir_path( __FILE__ ) . 'src/class-interactions.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/class-interaction.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/class-action.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/class-frontend-screen.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/security.php' );

require_once( plugin_dir_path( __FILE__ ) . 'src/locations.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/action-types.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types.php' );

require_once( plugin_dir_path( __FILE__ ) . 'src/locations/abstract-location.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-misc-all.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-type.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-archive.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-status.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-format.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-template.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-post-taxonomy.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-page.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-page-template.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-page-parent.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/locations/class-location-block-template.php' );

require_once( plugin_dir_path( __FILE__ ) . 'src/admin/manage-interactions.php' );

if ( ! is_admin() ) {
	require_once( plugin_dir_path( __FILE__ ) . 'src/frontend/frontend.php' );
}

if ( is_admin() ) {
	require_once( plugin_dir_path( __FILE__ ) . 'src/admin/admin.php' );
	require_once( plugin_dir_path( __FILE__ ) . 'src/editor/editor.php' );
}

/**
 * Load the interaction and action types. We split this off into a function so
 * it can only be called when needed.
 *
 * - editor.php calls this for the editor
 * - frontend.php calls this if there are interactions in the page.
 *
 * @return void
 */
if ( ! function_exists( 'interact_require_types' ) ) {
	function interact_require_types() {
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/abstract-action-type.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-display.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-visibility.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-opacity.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-move.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-rotate.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-scale.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-skew.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-text-color.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-confetti.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-css-rule.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-background-color.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-toggle-class.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-update-attribute.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-focus.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-redirect-to-url.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/action-types/class-action-type-toggle-video.php' );

		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/abstract-interaction-type.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-click.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-toggle.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-hover.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-mouse-hovering.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-mouse-press.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-enter-viewport.php' );
		// require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-keypress.php' );
		// require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-input-change.php' );
		// require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-page-create.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-page-load.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-page-scrolling.php' );
		// require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-mouse-move.php' );
		// require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-form-submitted.php' );
		require_once( plugin_dir_path( __FILE__ ) . 'src/interaction-types/class-interaction-type-element-scrolling.php' );

		do_action( 'interact/require_types' );
	}
}

// This is placed after the definition of interact_require_types() since these depend on it.
require_once( plugin_dir_path( __FILE__ ) . 'src/rest-api/class-rest-editor.php' );
require_once( plugin_dir_path( __FILE__ ) . 'src/rest-api/class-rest-location-rules.php' );

require_once( plugin_dir_path( __FILE__ ) . 'src/editor/interaction-library/index.php' );
