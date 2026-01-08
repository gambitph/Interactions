<?php
/**
 * Action Type: Skew
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Skew' ) ) {
	class Interact_Action_Type_Skew extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'skew';
			$this->category = 'animation';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Skew', 'interactions' );
			$this->description = __( 'Skew an element', 'interactions' );

			$this->keywords = [
				'skewx',
				'skewy',
				'twist',
			];

			$this->properties = [
				'x' => [
					'name' => 'X',
					'type' => 'number',
					'default' => 0,
					'min' => -360,
					'max' => 360,
					'step' => 0.1,
				],
				'y' => [
					'name' => 'Y',
					'type' => 'number',
					'default' => 0,
					'min' => -360,
					'max' => 360,
					'step' => 0.1,
				],
			];

			$this->has_dynamic = false;
		}

		public function sanitize_data_for_saving( $value ) {
			if ( is_array( $value ) && isset( $value['x'] ) ) {
				if ( is_numeric( $value['x'] ) ) {
					$value['x'] = $value['x'] + 0;
				} else {
					$value['x'] = null;
				}
			}
			if ( is_array( $value ) && isset( $value['y'] ) ) {
				if ( is_numeric( $value['y'] ) ) {
					$value['y'] = $value['y'] + 0;
				} else {
					$value['y'] = null;
				}
			}
			return $value;
		}
	}

	interact_add_action_type( 'skew', 'Interact_Action_Type_Skew' );
}
