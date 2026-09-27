<?php
/**
 * Plugin Name:       Tanglish Typing
 * Plugin URI:        https://onelifejourney.in
 * Description:       Tanglish (English letters la Tamil) type pannina Tamil-a convert aagum + suggestion dropdown. Plus oru English grammar/spelling check mode (LanguageTool). Toggle button-la 3 modes: Tanglish / English check / OFF.
 * Version:           1.3.0
 * Author:            One Life Journey
 * License:           GPL-2.0+
 * Text Domain:       tanglish-typing
 */

// Direct-a access panna mudiyaadhu (security)
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'TANGLISH_TYPING_VERSION', '1.3.0' );
define( 'TANGLISH_TYPING_URL', plugin_dir_url( __FILE__ ) );

/**
 * Admin editor screens la JS + CSS load pannu.
 */
function tanglish_typing_enqueue_admin( $hook ) {
    // Post / Page editor screens la maddum load pannu
    if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
        return;
    }

    wp_enqueue_style(
        'tanglish-typing',
        TANGLISH_TYPING_URL . 'assets/tanglish.css',
        array(),
        TANGLISH_TYPING_VERSION
    );

    wp_enqueue_script(
        'tanglish-typing',
        TANGLISH_TYPING_URL . 'assets/tanglish.js',
        array(),
        TANGLISH_TYPING_VERSION,
        true // footer la load pannu
    );
}
add_action( 'admin_enqueue_scripts', 'tanglish_typing_enqueue_admin' );
