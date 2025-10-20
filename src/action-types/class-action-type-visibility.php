<?php
/**
 * Action Type: Visibility
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Visibility' ) ) {
	class Interact_Action_Type_Visibility extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'visibility';
			$this->category = 'display';
			$this->type = 'all';

			$this->label = __( 'Visibility', 'interactions' );
			$this->description = __( 'Show or hide element', 'interactions' );

			$this->keywords = [
				'show',
				'hide',
			];

			$this->properties = [
				'visibility' => [
					'name' => __( 'Visibility', 'interactions' ),
					'type' => 'select',
					'options' => [
						[ 'label' => __( 'Toggle visibility', 'interactions' ), 'value' => 'toggle' ],
						[ 'label' => __( 'Hide', 'interactions' ), 'value' => 'hide' ],
						[ 'label' => __( 'Show', 'interactions' ), 'value' => 'show' ],
					],
					'default' => 'toggle',
				],
			];

			$this->has_duration = false;
			$this->has_easing = false;
			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'visibility', 'Interact_Action_Type_Visibility' );
}
