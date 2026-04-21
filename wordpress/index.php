<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
    
    <!-- Google Fonts: Montserrat (Fallback au cas où) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</head>
<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>

    <!-- Le point de montage de l'application React -->
    <div id="root"></div>

    <?php wp_footer(); ?>
    
    <script>
        // On injecte les variables WordPress pour React au besoin
        window.wpData = {
            apiUrl: '<?php echo esc_url(get_rest_url()); ?>',
            siteUrl: '<?php echo esc_url(get_site_url()); ?>',
            nonce: '<?php echo wp_create_nonce("wp_rest"); ?>'
        };
    </script>
</body>
</html>