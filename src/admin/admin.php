<?php
/**
 * Admin Settings
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Admin_Screens' ) ) {
	class Interact_Admin_Screens {
		function __construct() {
			add_action( 'admin_menu', array( $this, 'add_dashboard_page' ) );

			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

			add_action( 'admin_init', array( $this, 'redirect_to_welcome_page' ) );
		}

		public function add_dashboard_page() {
			// Our settings page.
			add_submenu_page(
				'options-general.php', // Parent slug.
				__( 'Interactions', 'interactions' ), // Page title.
				__( 'Interactions', 'interactions' ), // Menu title.
				'manage_options', // Capability.
				'interactions', // Menu slug.
				array( $this, 'getting_started_content' ), // Callback function.
				null // Position
			);

			// Our getting started page.
			add_submenu_page(
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reading page parameter for menu display logic
				isset( $_GET['page'] ) && sanitize_text_field( wp_unslash( $_GET['page'] ) ) === 'interactions-getting-started' ? 'options-general.php' : '', // Parent slug. Only show when in the page.
				__( 'Get Started', 'interactions' ), // Page title.
				'<span class="fs-submenu-item fs-sub"></span>' . esc_html( __( 'Get Started', 'interactions' ) ), // Menu title.
				'manage_options', // Capability.
				'interactions-getting-started', // Menu slug.
				array( $this, 'getting_started_content' ), // Callback function.
				null // Position
			);
		}

		public function enqueue_admin_scripts( $hook ) {
			// For Interactions pages, show our admin css.
			if ( stripos( $hook, 'page_interactions' ) !== false ) {
				wp_enqueue_style( 'interact-admin', plugins_url( 'dist/admin.css', INTERACT_FILE ), array(), INTERACT_VERSION );
			}
		}

		public function getting_started_content() {
			// check user capabilities
			if ( ! current_user_can( 'manage_options' ) ) {
				return;
			}

			if ( class_exists( 'Interact_Freemius' ) ) {
				$freemius = Interact_Freemius::get_instance();
				$activation_html = '';
				if ( ! $freemius->is_activated() ) {
					// Required for wp.ajax to work
					wp_enqueue_script( 'wp-util' );

					$modal = Interact_Freemius_Admin::get_instance()->get_license_key_modal_script();
					$allowed_tags = array_merge( wp_kses_allowed_html( 'post' ), [
						'style'  => [ 'type' => true ],
						'script' => [ 'type' => true ],
						'dialog' => [
							'class' => true,
							'id'    => true,
						],
						'input' => [
							'type' => true,
							'name' => true,
							'class' => true,
							'value' => true,
							'required' => true,
							'readonly' => true,
							'oncopy' => true,
						],
					]);


					echo wp_kses( $modal['html'], $allowed_tags );
					echo '<div class="notice-warning notice" style="padding: 16px;">' .
						'<p>' . esc_html( __( 'Your License key for Interactions is not activated. Please activate your license key to enable features specific to your plan and to receive premium plugin updates.', 'interactions' ) ) . '</p>' .
						'<button class="button button-primary" type="button" onclick="document.querySelector(\'#' . esc_attr( $modal['id'] ) . '\').showModal()">' .
						esc_html( __( 'Activate License', 'interactions' ) ) . '</button>' .
						'</div>';
				}
			}

			?>
			<div class="wrap interact-wrap">
				<div class="interact-header">
					<img class="interact-logo" src="<?php echo esc_url( plugins_url( 'src/admin/assets/interactions-logo.webp', INTERACT_FILE ) ); ?>" alt="Interactions Logo" />
					<nav></nav>
					<div></div>
				</div>
				<div class="interact-getting-started">
					<?php /* Translators: %1$s is the opening span tag and %2$s is the closing span tag */ ?>
					<h2><?php printf( esc_html( __( 'Make Your Website %1$sInteractive%2$s Using Interactions', 'interactions' ) ), '<span>', '</span>' ) ?></h2>
					<p class="interact-subtitle"><?php esc_html_e( 'Craft animations and dynamic user interactions with our versatile trigger and action engine.', 'interactions' ) ?></p>
					<div class="interact-video-wrapper">
						<iframe class="interact-video" src="https://www.youtube.com/embed/8qomdH6m9iA" title="<?php esc_attr( __( 'Getting Started', 'interactions' ) ) ?>" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;" allowFullScreen></iframe>
					</div>
					<!-- TODO: <a href="" class="interact-button"><?php esc_html_e( 'View Example Post', 'interactions' ) ?></a> -->
				</div>
				<div class="interact-3-column">
					<div class="interact-column">
						<div class="interact-icon"><img src="<?php echo esc_url( plugins_url( 'src/admin/assets/interaction-icon.svg', INTERACT_FILE ) ); ?>" alt="" /></div>
						<h3><?php esc_html_e( 'What are Interactions?', 'interactions' ) ?></h3>
						<p><?php esc_html_e( 'Interactions are a way to make your website more interactive. They are made up of triggers and actions.', 'interactions' ) ?></p>
						<p><?php esc_html_e( 'You can use interactions to create animations, dynamic user experiences, and more.', 'interactions' ) ?></p>
					</div>
					<div class="interact-column">
						<div class="interact-icon"><img src="<?php echo esc_url( plugins_url( 'src/admin/assets/trigger-icon.svg', INTERACT_FILE ) ); ?>" alt="" /></div>
						<h3><?php esc_html_e( 'What are Triggers?', 'interactions' ) ?></h3>
						<p><?php esc_html_e( 'Triggers are events that happen on the frontend of your website.', 'interactions' ) ?></p>
						<p><?php esc_html_e( 'Triggers can also be things like a clicking on an element, a class change, the user trying to exit the page, the page state changes, or even when the URL hash changes.', 'interactions' ) ?></p>
					</div>
					<div class="interact-column">
						<div class="interact-icon"><img src="<?php echo esc_url( plugins_url( 'src/admin/assets/action-icon.svg', INTERACT_FILE ) ); ?>" alt="" /></div>
						<h3><?php esc_html_e( 'What are Actions?', 'interactions' ) ?></h3>
						<p><?php esc_html_e( 'Actions are what happens when a trigger is fired.', 'interactions' ) ?></p>
						<p><?php esc_html_e( 'Actions can be things like animating or changing the color of an element, updating the contents of your page, changing the page state or even showing a confirmation dialog', 'interactions' ) ?></p>
					</div>
				</div>
				<div class="interact-2-column">
					<a href="https://docs.wpinteractions.com" class="interact-column interact-column-hover" target="_docs">
						<div class="interact-icon"><img src="<?php echo esc_url( plugins_url( 'src/admin/assets/documentation-icon.svg', INTERACT_FILE ) ); ?>" alt="" /></div>
						<h3><?php esc_html_e( 'Documentation', 'interactions' ) ?></h3>
						<p><?php esc_html_e( 'Visit our knowledge base for troubleshooting, guides, FAQs and updates.', 'interactions' ) ?></p>
						<span class="interact-button"><?php esc_html_e( 'Visit Documentation', 'interactions' ) ?></span>
					</a>
					<a href="https://www.facebook.com/groups/wpinteractions" class="interact-column interact-column-hover" target="_community">
						<div class="interact-icon"><img src="<?php echo esc_url( plugins_url( 'src/admin/assets/community-icon.svg', INTERACT_FILE ) ); ?>" alt="" /></div>
						<h3><?php esc_html_e( 'Community', 'interactions' ) ?></h3>
						<p><?php esc_html_e( 'Join the Interactions Community on Facebook. Discuss, ask questions, craft interactions with like-minded people.', 'interactions' ) ?></p>
						<span class="interact-button"><?php esc_html_e( 'Join Community', 'interactions' ) ?></span>
					</a>
				</div>
			</div>
			<?php
		}

		/**
		 * Adds a marker to remember to redirect after activation.
		 * Redirecting right away will not work.
		 */
		public static function start_redirect_to_welcome_page( $network_wide ) {
			if ( ! $network_wide ) {
				update_option( 'interact_redirect_to_welcome', '1', 'no' );
			}
		}

		/**
		 * Redirect to the welcome screen if our marker exists.
		 */
		public function redirect_to_welcome_page() {
			if ( get_option( 'interact_redirect_to_welcome' ) &&
				current_user_can( 'manage_options' ) &&
				true // ! sugb_fs()->is_activation_mode() // TODO: comment out for now, replace eventually with our own Freemius function.
			) {
				// Never go here again.
				delete_option( 'interact_redirect_to_welcome' );

				// Allow others to bypass the welcome screen.
				if ( ! apply_filters( 'interact/activation_screen_enabled', true ) ) {
					return;
				}

				// Or go to the getting started page.
				wp_redirect( esc_url( admin_url( 'options-general.php?page=interactions-getting-started' ) ) );

				die();
			}
		}
	}

	new Interact_Admin_Screens();
}

// This filter is used by the Freemius activation screen, we can disable redirection with this.
add_filter( 'fs_redirect_on_activation_interactions', function ( $redirect ) {
	return apply_filters( 'interact/activation_screen_enabled', $redirect );
} );

// Redirect to the welcome screen.
register_activation_hook( INTERACT_FILE, array( 'Interact_Admin_Screens', 'start_redirect_to_welcome_page' ) );
