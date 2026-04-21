<?php
/**
 * NEO Performance Theme Functions
 */

function neo_theme_setup() {
    // Support WooCommerce
    add_theme_support('woocommerce');
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
}
add_action('after_setup_theme', 'neo_theme_setup');

// On retire les scripts et styles par défaut de WordPress qui alourdissent le site
function neo_clean_head() {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
}
add_action('init', 'neo_clean_head');

// Chargement des scripts compilés de React
function neo_enqueue_scripts() {
    // Dans un build Vite, les fichiers sont dans le dossier assets/
    // On scanne le dossier assets pour trouver les bons fichiers (car les noms changent à chaque build)
    $assets_dir = get_template_directory() . '/assets';
    if (is_dir($assets_dir)) {
        $files = scandir($assets_dir);
        foreach ($files as $file) {
            if (str_ends_with($file, '.js')) {
                wp_enqueue_script('neo-react-app', get_template_directory_uri() . '/assets/' . $file, array(), null, true);
            }
            if (str_ends_with($file, '.css')) {
                wp_enqueue_style('neo-react-styles', get_template_directory_uri() . '/assets/' . $file);
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'neo_enqueue_scripts');
?>