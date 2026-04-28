<?php
/**
 * Interaction Type: Stackable Accordion Toggle
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Stackable_Carousel_Slide_Change' ) ) {
	class Interact_Interaction_Type_Stackable_Carousel_Slide_Change extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'stackableCarouselSlideChange';
			$this->type = 'element';
			$this->category = 'stackable';

			$this->label = __( 'Stackable Carousel Slide Change', 'interactions' );
			$this->description = __( 'Define actions that happen when the carousel changes its current slide', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Slide Change Actions', 'interactions' ),
					'slug' => 'carousel',
					'description' => '',
				],
			];
			$this->timeline_type = 'time';

			$this->options = [
				[
					'label' => __( 'Slide', 'interactions' ),
					'name' => 'slide',
					'type' => 'number',
					'default' => '',
					'min' => 1,
					'max' => 10,
					'step' => 1,
					'help' => __( 'When the carousel changes into this slide number, trigger the actions. Leave this blank to trigger for every slide change.', 'interactions' ),
				],
			];
		}
	}

	interact_add_interaction_type( 'stackableCarouselSlideChange', 'Interact_Interaction_Type_Stackable_Carousel_Slide_Change' );
}
