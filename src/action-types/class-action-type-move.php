<?php
/**
 * Action Type: Move
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Move' ) ) {
	class Interact_Action_Type_Move extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'move';
			$this->category = 'animation';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Move', 'interactions' );
			$this->description = __( 'Move an element', 'interactions' );

			$this->keywords = [
				'translate',
				'translatex',
				'translatey',
				'translatez',
				'x',
				'y',
				'z',
			];

			$this->properties = [
				'x' => [
					'name' => 'X',
					'type' => 'number',
					'default' => '', // This needs to be blank, if 0 then it will default to 0px.
					'min' => -100,
					'max' => 100,
					'step' => 1,
				],
				'y' => [
					'name' => 'Y',
					'type' => 'number',
					'default' => '', // This needs to be blank, if 0 then it will default to 0px.
					'min' => -100,
					'max' => 100,
					'step' => 1,
				],
				'z' => [
					'name' => 'Z',
					'type' => 'number',
				'default' => '', // This needs to be blank, if 0 then it will default to 0px.
					'min' => -100,
					'max' => 100,
					'step' => 1,
				],
			];

			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'move', 'Interact_Action_Type_Move' );
}
