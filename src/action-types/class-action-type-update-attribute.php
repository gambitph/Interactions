<?php
/**
 * Action Type: Toggle HTML attribute
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Update_Attribute' ) ) {
	class Interact_Action_Type_Update_Attribute extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'updateAttribute';
			$this->category = 'html';
			$this->type = 'all';

			$this->label = __( 'Update Attribute', 'interactions' );
			$this->dynamic_label = 'action'; // Use this property as the label.
			$this->description = __( 'Updates an HTML attribute', 'interactions' );

			$this->keywords = [
				'add',
				'remove',
				'data',
			];

			$this->properties = [
				'attribute' => [
					'name' => 'Attribute name',
					'type' => 'text',
					'default' => '',
				],
				'value' => [
					'name' => 'Value',
					'type' => 'text',
					'default' => '',
					'help' => __( 'The value to update the attribute to. If toggle is picked below, the attribute will be toggled with this value.', 'interactions' ),
				],
				'action' => [
					'name' => 'Action',
					'type' => 'select',
					'default' => 'update',
					'options' => [
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'update', 'label' => sprintf( __( 'Update %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'remove', 'label' => sprintf( __( 'Remove %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'toggle', 'label' => sprintf( __( 'Toggle %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
					],
					'help' => __( 'If update is picked, the attribute will be updated to the specifiied value. If remove, the attribute name will just be removed. If toggle, then the attribute with the value will be toggled on and off.', 'interactions' )
				],
			];

			$this->has_starting_state = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'updateAttribute', 'Interact_Action_Type_Update_Attribute' );
}
