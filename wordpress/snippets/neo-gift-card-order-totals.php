<?php
/**
 * NEO — affiche la carte-cadeau dans les totaux de commande.
 *
 * Le checkout headless applique la carte-cadeau comme un PAIEMENT FRACTIONNE :
 * la commande garde son total et ses taxes complets (comptabilite intacte),
 * seul le montant encaisse par Moneris est reduit. Le montant applique est
 * trace dans la meta _neo_gift_card_amount.
 *
 * Sans ce filtre, aucun courriel n'affichait la carte-cadeau et le « Total »
 * se lisait comme de l'argent reellement recu (ex. commande #7854 :
 * total 481,70 $, dont 480,00 $ en carte-cadeau et 1,70 $ encaisses).
 *
 * woocommerce_get_order_item_totals alimente TOUS les rendus de totaux :
 * courriels client, courriel admin « Nouvelle commande », page de
 * remerciement et espace client.
 *
 * Installe sur wp.neoperformance.ca via Code Snippets (WP Engine bloque les
 * file managers) : snippet PHP #10 « NEO — carte-cadeau dans les totaux de
 * commande », actif, portee « Run everywhere ». Ce fichier est la copie de
 * reference — le corps ci-dessous (sans la balise <?php) est identique au
 * snippet installe. Les accents des libelles passent par des entites HTML,
 * l'injection du code dans l'editeur ne garantissant pas l'UTF-8.
 */

add_filter( 'woocommerce_get_order_item_totals', 'neo_gift_card_total_rows', 10, 2 );

function neo_gift_card_total_rows( $total_rows, $order ) {
	if ( ! is_a( $order, 'WC_Order' ) ) {
		return $total_rows;
	}

	$amount = (float) $order->get_meta( '_neo_gift_card_amount' );
	if ( $amount <= 0 ) {
		return $total_rows;
	}

	// 4 derniers caracteres seulement : suffisant pour rapprocher la
	// transaction, sans promener le numero complet dans les boites courriel.
	// Le numero entier reste dans la note admin de la commande.
	$number = (string) $order->get_meta( '_neo_gift_card_number' );
	$last4  = $number ? substr( str_replace( '-', '', $number ), -4 ) : '';

	$charged = max( 0, round( (float) $order->get_total() - $amount, 2 ) );

	$rows = array(
		'neo_gift_card' => array(
			'label' => $last4
				? sprintf( 'Pay&eacute; par carte-cadeau (&bull;&bull;&bull;&bull; %s) :', $last4 )
				: 'Pay&eacute; par carte-cadeau :',
			'value' => '-' . wc_price( $amount, array( 'currency' => $order->get_currency() ) ),
		),
		'neo_amount_charged' => array(
			'label' => sprintf( 'Encaiss&eacute; (%s) :', $order->get_payment_method_title() ? $order->get_payment_method_title() : 'paiement' ),
			'value' => wc_price( $charged, array( 'currency' => $order->get_currency() ) ),
		),
	);

	// Inserees APRES le total : le total reste la valeur comptable de la vente,
	// les deux lignes qui suivent expliquent comment elle a ete reglee.
	if ( isset( $total_rows['order_total'] ) ) {
		$out = array();
		foreach ( $total_rows as $key => $row ) {
			$out[ $key ] = $row;
			if ( 'order_total' === $key ) {
				$out = array_merge( $out, $rows );
			}
		}
		return $out;
	}

	return array_merge( $total_rows, $rows );
}
