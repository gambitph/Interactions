<?php
/**
 * Action Type: Move
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Rotate' ) ) {
	class Interact_Action_Type_Rotate extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'rotate';
			$this->category = 'animation';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Rotate', 'interactions' );
			$this->description = __( 'Rotate an element', 'interactions' );

			$this->keywords = [
				'spin',
			];

			$this->properties = [
				'rotate' => [
					'name' => __( 'Rotate', 'interactions' ),
					'type' => 'number',
					'default' => 0,
					'min' => -360,
					'max' => 360,
					'step' => 0.1,
				],
				'transformOrigin' => [
					'name' => __( 'Transform Origin', 'interactions' ),
					'type' => 'select',
					'options' => [
						[ 'label' => __( 'Center', 'interactions' ), 'value' => 'center' ],
						[ 'label' => __( 'Top', 'interactions' ), 'value' => 'top' ],
						[ 'label' => __( 'Right', 'interactions' ), 'value' => 'right' ],
						[ 'label' => __( 'Bottom', 'interactions' ), 'value' => 'bottom' ],
						[ 'label' => __( 'Left', 'interactions' ), 'value' => 'left' ],
						[ 'label' => __( 'Top Left', 'interactions' ), 'value' => 'top left' ],
						[ 'label' => __( 'Top Right', 'interactions' ), 'value' => 'top right' ],
						[ 'label' => __( 'Bottom Left', 'interactions' ), 'value' => 'bottom left' ],
						[ 'label' => __( 'Bottom Right', 'interactions' ), 'value' => 'bottom right' ],
						[ 'label' => __( 'Custom', 'interactions' ), 'value' => 'custom' ],
					],
					'default' => 'center',
				],
				'customTransformOrigin' => [
					'name' => __( 'Custom Transform Origin', 'interactions' ),
					'type' => 'text',
					'default' => '',
					'help' => __( 'Provide a CSS transform origin value.', 'interactions' ),
					'condition' => [
						'property' => 'transformOrigin',
						'value' => 'custom',
					],
				],
			];

			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'rotate', 'Interact_Action_Type_Rotate' );
}
