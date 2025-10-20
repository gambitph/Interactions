<?php
/**
 * Action helper functions.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$interact_action_types = [];

if ( ! function_exists( 'interact_add_action_type' ) ) {
	function interact_add_action_type( $name, $class ) {
		global $interact_action_types;
		$interact_action_types[ $name ] = new $class();
	}
}

if ( ! function_exists( 'interact_get_action_type' ) ) {
	function interact_get_action_type( $name ) {
		global $interact_action_types;
		return isset( $interact_action_types[ $name ] ) ? $interact_action_types[ $name ] : false;
	}
}

if ( ! function_exists( 'interact_get_action_types' ) ) {
	function interact_get_action_types() {
		global $interact_action_types;
		return $interact_action_types;
	}
}
