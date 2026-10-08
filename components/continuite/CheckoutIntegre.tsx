'use client';
import { useRouter } from 'next/navigation';
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
  if (clientSecret.startsWith('mock_cs__')) return <PaiementSimule clientSecret={clientSecret} />;

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

// Remplace le cadre Stripe en simulation locale (voir lib/continuite/mock.ts).
function PaiementSimule({ clientSecret }: { clientSecret: string }) {
  const router = useRouter();
  const suite = clientSecret.replace('mock_cs__', '');
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
      <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Paiement simulé</p>
      <p className="mt-2 text-gray-800">Ici apparaîtra le formulaire de carte Stripe.</p>
      <button
        type="button"
        onClick={() => router.push(`/continuite/merci?session_id=mock_session__${suite}`)}
        className="mt-5 inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full bg-[#007F78] text-white hover:bg-[#00615C]"
      >
        Simuler un paiement réussi
      </button>
    </div>
  );
}
