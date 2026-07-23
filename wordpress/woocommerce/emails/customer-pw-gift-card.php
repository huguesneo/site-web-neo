<?php
/**
 * Gabarit personnalisé NEO Performance — courriel de carte-cadeau PW.
 *
 * Remplace templates/woocommerce/emails/customer-pw-gift-card.php du plugin
 * PW Gift Cards Pro (système de gabarits WooCommerce : ce fichier doit vivre
 * dans wp-content/themes/neo-performance/woocommerce/emails/). Il reçoit les
 * mêmes variables que l'original : $item_data (amount, wc_price_args,
 * gift_card_number, redeem_url, from, message, preview), $email_heading, $email.
 *
 * HTML « courriel » volontairement vieux jeu (tables + styles en ligne) :
 * Gmail/Outlook ne supportent ni flexbox ni les feuilles de style externes.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Le bouton mène TOUJOURS à la boutique du site headless (le réglage
// « Redeem URL » du plugin pointait vers l'ancienne boutique WordPress).
$neo_redeem_url = 'https://neoperformance.ca/boutique';

// Couleurs de marque NEO (index.css du site : --color-neo).
$neo_teal      = '#00BBB1';
$neo_teal_dark = '#007F78';
$neo_teal_deep = '#004541';
$neo_teal_pale = '#F2FBFA';
$neo_ink       = '#1A1A1A';
$neo_gray      = '#5F5E5A';

if ( ! $item_data->preview ) {
    do_action( 'woocommerce_email_header', $email_heading, $email );
}

if ( ! empty( $item_data->from ) ) {
    ?>
    <p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: <?php echo $neo_gray; ?>; margin: 0 0 8px;">
        De&nbsp;: <?php echo esc_html( $item_data->from ); ?>
    </p>
    <?php
}

if ( ! empty( $item_data->message ) ) {
    ?>
    <p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: <?php echo $neo_ink; ?>; font-style: italic; margin: 0 0 16px;">
        «&nbsp;<?php echo nl2br( esc_html( $item_data->message ) ); ?>&nbsp;»
    </p>
    <?php
}
?>

<p style="font-family: Helvetica, Arial, sans-serif; font-size: 15px; color: <?php echo $neo_gray; ?>; line-height: 1.6; margin: 0 0 20px;">
    Merci pour votre achat&nbsp;! Voici votre carte-cadeau, utilisable en tout temps
    sur notre boutique en ligne.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid <?php echo $neo_teal; ?>; border-radius: 12px; background-color: <?php echo $neo_teal_pale; ?>; margin: 0 0 24px;">
    <tr>
        <td align="center" style="padding: 28px 24px;">
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: <?php echo $neo_teal_dark; ?>;">
                Carte-cadeau NEO Performance
            </div>
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 40px; font-weight: bold; color: <?php echo $neo_ink; ?>; margin: 14px 0 18px;">
                <?php echo wc_price( $item_data->amount, $item_data->wc_price_args ); ?>
            </div>
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: <?php echo $neo_gray; ?>; margin-bottom: 6px;">
                Numéro de la carte
            </div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: <?php echo $neo_teal_deep; ?>;">
                <?php echo esc_html( $item_data->gift_card_number ); ?>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 22px;">
                <tr>
                    <td align="center" bgcolor="<?php echo $neo_teal; ?>" style="border-radius: 8px;">
                        <a href="<?php echo esc_url( $neo_redeem_url ); ?>" style="display: inline-block; padding: 14px 36px; font-family: Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none;">
                            Utiliser ma carte
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E5E5E0; margin: 0 0 8px;">
    <tr>
        <td style="padding-top: 18px;">
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: <?php echo $neo_ink; ?>; margin-bottom: 10px;">
                Comment l'utiliser
            </div>
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: <?php echo $neo_gray; ?>; line-height: 1.9;">
                <span style="color: <?php echo $neo_teal; ?>; font-weight: bold;">1.</span>&nbsp;
                Magasinez sur <a href="<?php echo esc_url( $neo_redeem_url ); ?>" style="color: <?php echo $neo_teal_dark; ?>;">neoperformance.ca/boutique</a><br />
                <span style="color: <?php echo $neo_teal; ?>; font-weight: bold;">2.</span>&nbsp;
                Au paiement, entrez le numéro dans le champ «&nbsp;Carte-cadeau&nbsp;»<br />
                <span style="color: <?php echo $neo_teal; ?>; font-weight: bold;">3.</span>&nbsp;
                Le montant se déduit automatiquement — le solde inutilisé reste sur votre carte
            </div>
            <p style="font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: <?php echo $neo_gray; ?>; margin: 18px 0 0;">
                Des questions&nbsp;? Écrivez-nous à
                <a href="mailto:info@neoperformance.ca" style="color: <?php echo $neo_teal_dark; ?>;">info@neoperformance.ca</a>.
            </p>
        </td>
    </tr>
</table>

<?php
if ( ! $item_data->preview ) {
    do_action( 'woocommerce_email_footer', $email );
}
