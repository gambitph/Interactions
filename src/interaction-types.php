<?php
/**
 * Interactions helper functions.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$interact_interaction_types = [];

if ( ! function_exists( 'interact_add_interaction_type' ) ) {
	function interact_add_interaction_type( $name, $class ) {
		global $interact_interaction_types;
		$interact_interaction_types[ $name ] = new $class();
	}
}

if ( ! function_exists( 'interact_get_interaction_type' ) ) {
	function interact_get_interaction_type( $name ) {
		global $interact_interaction_types;
		return $interact_interaction_types[ $name ] ?? false;
	}
}

if ( ! function_exists( 'interact_get_interaction_types' ) ) {
	function interact_get_interaction_types() {
		global $interact_interaction_types;
		return $interact_interaction_types;
	}
}
