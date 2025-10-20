<?php
/**
 * Action Type: Background Color
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Background_Color' ) ) {
	class Interact_Action_Type_Background_Color extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'backgroundColor';
			$this->category = 'style';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Background Color', 'interactions' );
			$this->description = __( 'Changes the background color', 'interactions' );

			$this->keywords = [
				'bg',
			];

			$this->properties = [
				'color' => [
					'name' => __( 'Background Color', 'interactions' ),
					'type' => 'color',
					'default' => '#000000',
				],
			];

			$this->has_dynamic = false;
		}

		// DEV NOTE: Comment out, let's do this in JS for now because that might also handle for the editor.
		// public function initilize_action( $action, $animation_data ) {
		// 	// If the target is a cover block, we need to change the target to the background element.
		// 	if ( $action['target']['type'] === 'block' && $action['target']['blockName'] === 'core/cover' ) {
		// 		$action['target']['value'] = $action['target']['value'] . ' > .wp-block-cover__background';
		// 	}

		// 	if ( $action['target']['type'] === 'trigger' ) {
		// 		$interaction_target = $animation_data['target'];
		// 		if ( $interaction_target['type'] === 'block' && $interaction_target['blockName'] === 'core/cover' ) {
		// 			$action['target']['type'] = 'block';
		// 			$action['target']['value'] = $interaction_target['value'] . ' > .wp-block-cover__background';
		// 			$action['target']['blockName'] = 'core/cover';
		// 		}
		// 	}

		// 	return parent::initilize_action( $action, $animation_data );
		// }
	}

	interact_add_action_type( 'backgroundColor', 'Interact_Action_Type_Background_Color' );
}
