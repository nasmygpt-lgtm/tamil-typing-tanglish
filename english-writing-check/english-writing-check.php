<?php
/**
 * Plugin Name:       English Writing Check
 * Plugin URI:        https://onelifejourney.in
 * Description:       Post/Page editor la English-la ezhuthina, spelling + grammar mistakes-a subtle-a mark panni, click pannina correct suggestion (Fix) kaattum. LanguageTool free service use aagum.
 * Version:           1.0.1
 * Author:            One Life Journey
 * License:           GPL-2.0+
 * Text Domain:       english-writing-check
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'EWC_VERSION', '1.0.1' );
define( 'EWC_URL', plugin_dir_url( __FILE__ ) );

/**
 * Admin editor screens la JS + CSS load pannu.
 */
function ewc_enqueue_admin( $hook ) {
    if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
        return;
    }

    wp_enqueue_style(
        'english-writing-check',
        EWC_URL . 'assets/ewc.css',
        array(),
        EWC_VERSION
    );

    wp_enqueue_script(
        'english-writing-check',
        EWC_URL . 'assets/ewc.js',
        array(),
        EWC_VERSION,
        true
    );
}
add_action( 'admin_enqueue_scripts', 'ewc_enqueue_admin' );
