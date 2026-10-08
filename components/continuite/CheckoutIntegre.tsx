'use client';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';

const CLE_PUBLIABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

// Une seule instance Stripe.js pour toute la session de navigation.
let stripePromise: Promise<Stripe | null> | null = null;
const obtenirStripe = () => (stripePromise ??= loadStripe(CLE_PUBLIABLE, { locale: 'fr-CA' }));

/*
  Stripe Checkout intégré. La carte est saisie dans le cadre de Stripe : un
  refus de carte y est affiché par Stripe lui-même. Au succès, Stripe
  redirige vers la return_url fixée par l'endpoint (/continuite/merci).
*/
export default function CheckoutIntegre({ clientSecret }: { clientSecret: string }) {
  if (!CLE_PUBLIABLE) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Le paiement n&apos;est pas configuré (clé Stripe manquante).
      </p>
    );
  }

  return (
    <div id="checkout" className="min-h-[480px]">
      <EmbeddedCheckoutProvider stripe={obtenirStripe()} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
