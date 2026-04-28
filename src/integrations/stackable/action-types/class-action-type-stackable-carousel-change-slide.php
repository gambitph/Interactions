<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Carousel_Change_Slide' ) ) {
	class Interact_Action_Type_Stackable_Carousel_Change_Slide extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableCarouselChangeSlide';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Carousel Change Slide', 'interactions' );
			$this->description = __( 'Change the current slide of the Stackable Carousel', 'interactions' );

			$this->keywords = [];

			$this->properties = [
				'slide' => [
					'name' => __( 'Slide', 'interactions' ),
					'type' => 'number',
					'default' => '',
					'min' => 1,
					'max' => 10,
					'step' => 1,
					'help' => __( 'The slide number to change into. Leave this blank to change into the next slide.', 'interactions' ),
				],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableCarouselChangeSlide', 'Interact_Action_Type_Stackable_Carousel_Change_Slide' );
}
