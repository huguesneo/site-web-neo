<?php
/**
 * NEO — cueillette en clinique dans les courriels WooCommerce.
 *
 * Le checkout headless (option « Recuperer ma commande en clinique ») cree la
 * commande avec le mode d'expedition « Cueillette en clinique » (local_pickup)
 * et la meta _neo_pickup = yes. Ce snippet rend ce choix impossible a manquer :
 *
 *  - courriel admin « Nouvelle commande » : sujet prefixe [CUEILLETTE EN CLINIQUE]
 *    + bandeau en tete « ne pas expedier » ;
 *  - courriel client « Commande en cours » : « Ta commande a bien ete recue.
 *    Elle sera disponible d'ici 30 minutes. » + adresse et heures de la clinique.
 *    Hors des heures d'ouverture (ou moins de 30 min avant la fermeture), le
 *    message annonce plutot la prochaine ouverture.
 *
 * Meme regle d'heures que lib/pickup.ts cote site — garder les deux synchronises.
 *
 * A installer sur wp.neoperformance.ca via Code Snippets (WP Engine bloque les
 * file managers) : nouveau snippet PHP « NEO — cueillette en clinique dans les
 * courriels », portee « Run everywhere ». Ce fichier est la copie de reference —
 * coller le corps ci-dessous sans la balise <?php. Les accents passent par des
 * entites HTML, l'injection du code dans l'editeur ne garantissant pas l'UTF-8.
 */

add_filter( 'woocommerce_email_subject_new_order', 'neo_pickup_admin_subject', 20, 2 );
add_action( 'woocommerce_email_before_order_table', 'neo_pickup_email_block', 5, 4 );

function neo_pickup_is_pickup( $order ) {
	if ( ! is_a( $order, 'WC_Order' ) ) {
		return false;
	}
	if ( 'yes' === $order->get_meta( '_neo_pickup' ) ) {
		return true;
	}
	foreach ( $order->get_shipping_methods() as $method ) {
		if ( 'local_pickup' === $method->get_method_id() ) {
			return true;
		}
	}
	return false;
}

/** Message de disponibilite selon l'heure de la commande (heure de Montreal). */
function neo_pickup_ready_message( $order ) {
	$opening = array(
		1 => array( 480, 1020 ), // lundi    8 h - 17 h
		2 => array( 480, 1020 ),
		3 => array( 480, 1020 ),
		4 => array( 480, 1020 ),
		5 => array( 480, 720 ),  // vendredi 8 h - 12 h
	);
	$days = array( 'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi' );

	$date = $order->get_date_paid() ? $order->get_date_paid() : $order->get_date_created();
	$ts   = $date ? $date->getTimestamp() : time();
	$dt   = new DateTime( '@' . $ts );
	$dt->setTimezone( new DateTimeZone( 'America/Toronto' ) );
	$day     = (int) $dt->format( 'w' );
	$minutes = (int) $dt->format( 'G' ) * 60 + (int) $dt->format( 'i' );

	$received = 'Ta commande a bien &eacute;t&eacute; re&ccedil;ue.';
	if ( isset( $opening[ $day ] ) && $minutes >= $opening[ $day ][0] && $minutes <= $opening[ $day ][1] - 30 ) {
		return $received . ' Elle sera disponible d&rsquo;ici 30 minutes.';
	}
	if ( isset( $opening[ $day ] ) && $minutes < $opening[ $day ][0] ) {
		return $received . ' Elle sera pr&ecirc;te d&egrave;s l&rsquo;ouverture de la clinique, aujourd&rsquo;hui &agrave; 8 h.';
	}
	for ( $i = 1; $i <= 7; $i++ ) {
		$d = ( $day + $i ) % 7;
		if ( isset( $opening[ $d ] ) ) {
			$when = 1 === $i ? 'demain' : $days[ $d ];
			return $received . ' Elle sera pr&ecirc;te d&egrave;s l&rsquo;ouverture de la clinique, ' . $when . ' &agrave; 8 h.';
		}
	}
	return $received;
}

function neo_pickup_admin_subject( $subject, $order ) {
	if ( neo_pickup_is_pickup( $order ) ) {
		return '[CUEILLETTE EN CLINIQUE] ' . $subject;
	}
	return $subject;
}

function neo_pickup_email_block( $order, $sent_to_admin, $plain_text, $email ) {
	if ( ! neo_pickup_is_pickup( $order ) || ! is_object( $email ) ) {
		return;
	}

	$address = '7005 Bd Taschereau #350, Brossard, QC J4Z 1A7';
	$hours   = 'Lundi au jeudi de 8 h &agrave; 17 h &middot; Vendredi de 8 h &agrave; 12 h';

	if ( 'new_order' === $email->id ) {
		$title = 'CUEILLETTE EN CLINIQUE &mdash; ne pas exp&eacute;dier';
		$body  = 'Le client passera r&eacute;cup&eacute;rer sa commande &agrave; la clinique. Pr&eacute;parer la commande et la garder &agrave; l&rsquo;accueil.';
	} elseif ( 'customer_processing_order' === $email->id ) {
		$title = 'Cueillette en clinique';
		$body  = neo_pickup_ready_message( $order );
	} else {
		return;
	}

	if ( $plain_text ) {
		$decode = function ( $s ) {
			return html_entity_decode( $s, ENT_QUOTES, 'UTF-8' );
		};
		echo "\n==========\n" . mb_strtoupper( $decode( $title ), 'UTF-8' ) . "\n" . $decode( $body ) . "\n"
			. $decode( $address ) . "\n" . $decode( $hours ) . "\n==========\n\n";
		return;
	}

	echo '<div style="margin:0 0 24px;padding:16px 18px;border:2px solid #14b8a6;border-radius:10px;background:#f0fdfa;">'
		. '<p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#0f766e;">' . $title . '</p>'
		. '<p style="margin:0 0 10px;font-size:14px;color:#111827;">' . $body . '</p>'
		. '<p style="margin:0;font-size:13px;color:#374151;"><strong>' . $address . '</strong><br>' . $hours . '</p>'
		. '</div>';
}
