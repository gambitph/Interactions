<?php
/**
 * Security Functions
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'interact_salt' ) ) {
	/**
	 * Get a salt for hashing.
	 *
	 * @return string
	 */
	function interact_salt() {
		$salt = get_option( 'interact_salt' );
		if ( ! $salt ) {
			$salt = wp_salt();
			update_option( 'interact_salt', $salt, 'no' );
		}
		return $salt;
	}
}
