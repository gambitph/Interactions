<?php
/**
 * Action Type: Toggle CSS class
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Toggle_Class' ) ) {
	class Interact_Action_Type_Toggle_Class extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'toggleClass';
			$this->category = 'style';
			$this->type = 'all';

			$this->label = __( 'Toggle CSS Class', 'interactions' );
			$this->short_label = __( 'Toggle Class', 'interactions' );
			$this->dynamic_label = 'action'; // Use this property as the label.
			$this->description = __( 'Toggles a CSS class', 'interactions' );

			$this->keywords = [
				'add',
				'remove',
			];

			$this->properties = [
				'class' => [
					'name' => 'Class name',
					'type' => 'text',
					'default' => '',
				],
				'action' => [
					'name' => 'Action',
					'type' => 'select',
					'default' => 'add',
				'options' => [
					// Translators: %s is the word 'class'.
					[ 'value' => 'add', 'label' => sprintf( __( 'Add %s', 'interactions' ), __( 'class', 'interactions' ) ) ],
					// Translators: %s is the word 'class'.
					[ 'value' => 'remove', 'label' => sprintf( __( 'Remove %s', 'interactions' ), __( 'class', 'interactions' ) ) ],
					// Translators: %s is the word 'class'.
					[ 'value' => 'toggle', 'label' => sprintf( __( 'Toggle %s', 'interactions' ), __( 'class', 'interactions' ) ) ],
				]
				],
			];

			$this->has_starting_state = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'toggleClass', 'Interact_Action_Type_Toggle_Class' );
}
