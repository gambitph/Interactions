<?php
/**
 * Action Type: Toggle Video
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Toggle_Video' ) ) {
	class Interact_Action_Type_Toggle_Video extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'toggleVideo';
			$this->category = 'misc';
			$this->type = 'all';

			$this->label = __( 'Play/Pause Video', 'interactions' );
			$this->description = __( 'Play or pause a video.', 'interactions' );

			$this->keywords = [
				'video',
			];

			$this->properties = [
				'mode' => [
					'name' => __( 'Mode', 'interactions' ),
					'type' => 'select',
					'options' => [
						[ 'label' => __( 'Play', 'interactions' ), 'value' => 'play' ],
						[ 'label' => __( 'Pause', 'interactions' ), 'value' => 'pause' ],
						[ 'label' => __( 'Toggle', 'interactions' ), 'value' => 'toggle' ],
					],
					'default' => 'play',
					'help' => __( 'Play, pause or toggle a video.', 'interactions' ),
				],
				'startTime' => [
					'name' => __( 'Start Time ', 'interactions' ),
					'type' => 'number',
					'default' => '',
					'min' => 0,
					'max' => 30,
					'step' => 0.1,
					'help' => __( 'The time where to start playing. Used only when the video is going to play. Leave blank to play at current time.', 'interactions' ),
					'condition' => [
						'property' => 'mode',
						'value' => 'play',
					],
				],
				
			];

			$this->has_dynamic = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}

		public function sanitize_data_for_saving( $value ) {
			if ( is_array( $value ) && isset( $value['mode'] ) ) {
				$allowed_modes = [ 'play', 'pause', 'toggle' ];
				if ( ! in_array( $value['mode'], $allowed_modes, true ) ) {
					$value['mode'] = 'play';
				}
			}
			if ( is_array( $value ) && isset( $value['startTime'] ) ) {
				if ( is_numeric( $value['startTime'] ) ) {
					$value['startTime'] = $value['startTime'] + 0;
				} else {
					$value['startTime'] = null;
				}
			}
			return $value;
		}
	}

	interact_add_action_type( 'toggleVideo', 'Interact_Action_Type_Toggle_Video' );
}
