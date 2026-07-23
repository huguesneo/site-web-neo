/**
 * Helper serveur — statut à donner à une commande au moment où elle est payée.
 *
 * PW Gift Cards ne génère la carte-cadeau (numéro + courriel à l'acheteur)
 * qu'au passage de la commande à « completed » — jamais à « processing »
 * (option `pwgc_send_when_processing` désactivée sur la boutique). Sur
 * l'ancien site, le checkout natif WooCommerce terminait automatiquement les
 * commandes 100 % virtuelles après paiement, ce qui déclenchait la carte. Le
 * site headless doit reproduire ce choix lui-même : une commande payée qui ne
 * contient QUE des cartes-cadeaux passe à « completed » (→ PW crée la carte et
 * envoie le courriel) ; toute commande avec des produits à expédier reste à
 * « processing » (la carte éventuelle sera créée quand la commande sera
 * marquée terminée dans l'admin, comme avant).
 */
import { GIFT_CARD_PRODUCT_ID } from '../constants';

export function paidStatusFor(lineItems: unknown): 'completed' | 'processing' {
  const items = Array.isArray(lineItems) ? (lineItems as Array<{ product_id?: unknown }>) : [];
  const allGiftCards =
    items.length > 0 && items.every((li) => Number(li.product_id) === GIFT_CARD_PRODUCT_ID);
  return allGiftCards ? 'completed' : 'processing';
}
