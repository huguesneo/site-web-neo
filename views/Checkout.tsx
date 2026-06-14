'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, Lock, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Section from '../components/Section';

// ─── Moneris Hosted Tokenization (iframe sécurisée) ─────────────────────────────
const HT_IS_PROD = process.env.NEXT_PUBLIC_MONERIS_ENV === 'prod';
const HT_HOST = HT_IS_PROD ? 'https://www3.moneris.com' : 'https://esqa.moneris.com';
const HT_ORIGIN = `${HT_HOST}/HPPtoken/index.php`;
const HT_PROFILE_ID = process.env.NEXT_PUBLIC_MONERIS_HT_PROFILE_ID || '';

// URL de l'iframe : champs carte (numéro + expiration + CVV) stylés sobrement.
const HT_IFRAME_SRC =
  `${HT_HOST}/HPPtoken/index.php?id=${HT_PROFILE_ID}&pmmsg=true` +
  `&enable_exp=1&enable_cvd=1&display_labels=1` +
  `&css_body=font-family:sans-serif;` +
  `&css_textbox=border:1px solid %23d1d5db;border-radius:10px;padding:10px;width:90%25;` +
  `&css_input_label=color:%23374151;font-size:13px;`;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
}

// Label affiché → code ISO requis par WooCommerce
const PROVINCES: { label: string; code: string }[] = [
  { label: 'Alberta',                    code: 'AB' },
  { label: 'Colombie-Britannique',       code: 'BC' },
  { label: 'Manitoba',                   code: 'MB' },
  { label: 'Nouveau-Brunswick',          code: 'NB' },
  { label: 'Terre-Neuve-et-Labrador',    code: 'NL' },
  { label: 'Nouvelle-Écosse',            code: 'NS' },
  { label: 'Ontario',                    code: 'ON' },
  { label: 'Île-du-Prince-Édouard',      code: 'PE' },
  { label: 'Québec',                     code: 'QC' },
  { label: 'Saskatchewan',              code: 'SK' },
];

const Checkout: React.FC = () => {
  const { items, subtotal, coupon, clearCart, hydrated } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', province: 'QC', postalCode: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId: number; total: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Contexte de la commande en cours, lu par le gestionnaire de message de l'iframe
  const pendingRef = useRef<{ orderId: number; total: number } | null>(null);
  const finalizedRef = useRef(false);

  const discount = coupon?.discountValue ?? 0;
  const taxes = (subtotal - discount) * 0.14975;
  const total = subtotal - discount + taxes;

  useEffect(() => {
    if (hydrated && items.length === 0 && status === 'idle') {
      router.push('/boutique');
    }
  }, [hydrated, items.length, status, router]);

  if (hydrated && items.length === 0 && status === 'idle') {
    return null;
  }

  // ─── Écran de confirmation après paiement approuvé ───────────────────────────
  if (status === 'success' && orderInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full animate-fade-in">
          <div className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={38} className="text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Paiement réussi !</h1>
          <p className="text-gray-400 text-sm mb-1">Commande #{orderInfo.orderId}</p>
          <p className="text-neo text-2xl font-extrabold mb-6 tracking-tight">
            {orderInfo.total.toFixed(2)} $
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Merci pour ta commande ! Un courriel de confirmation te sera envoyé. Expédition sous 24/48h.
          </p>

          <button
            onClick={() => router.push('/boutique')}
            className="inline-flex items-center gap-2 bg-neo hover:bg-neo-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-neo/25 mb-6"
          >
            Retour à la boutique
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-neo" /> Chiffrement SSL
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-neo" /> Moneris sécurisé
            </span>
            <span className="flex items-center gap-1.5">
              <Package size={12} className="text-neo" /> Expédition 24/48h
            </span>
          </div>
        </div>
      </div>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const wcUrl    = process.env.NEXT_PUBLIC_WC_URL;
  const wcKey    = process.env.NEXT_PUBLIC_WC_KEY;
  const wcSecret = process.env.NEXT_PUBLIC_WC_SECRET;

  // ─── Étape 3 : encaisser avec le token reçu de l'iframe ─────────────────────
  async function payWithToken(temporaryToken: string) {
    const ctx = pendingRef.current;
    if (!ctx || finalizedRef.current) return;
    finalizedRef.current = true;
    try {
      const payRes = await fetch('/api/moneris/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: Math.round(ctx.total * 100),
          temporaryToken,
          orderId: ctx.orderId,
          customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
        }),
      });
      const pay = await payRes.json();
      if (!payRes.ok || !pay.approved) {
        throw new Error(pay.error || 'Le paiement a été refusé.');
      }

      // Marquer la commande WooCommerce comme payée
      await fetch(
        `${wcUrl}/wp-json/wc/v3/orders/${ctx.orderId}?consumer_key=${wcKey}&consumer_secret=${wcSecret}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing', set_paid: true, transaction_id: pay.paymentId ?? '' }),
        }
      ).catch(() => { /* paiement déjà encaissé; non bloquant */ });

      clearCart();
      setOrderInfo({ orderId: ctx.orderId, total: ctx.total });
      setStatus('success');
    } catch (e: unknown) {
      finalizedRef.current = false;
      setErrorMsg(e instanceof Error ? e.message : 'Erreur lors du paiement.');
      setStatus('error');
    }
  }

  // ─── Écoute la réponse de l'iframe Hosted Tokenization ──────────────────────
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.origin.includes('moneris.com')) return;
      let resp: { responseCode?: string[] | string; dataKey?: string; errorMessage?: string };
      try {
        resp = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch { return; }
      if (!resp || (resp.dataKey === undefined && resp.responseCode === undefined)) return;

      const codes = Array.isArray(resp.responseCode) ? resp.responseCode : [resp.responseCode];
      const success = !!resp.dataKey && codes.every((c) => Number(c) < 50);

      if (success && resp.dataKey) {
        payWithToken(resp.dataKey);
      } else {
        finalizedRef.current = false;
        setErrorMsg(resp.errorMessage || 'Carte invalide. Vérifie le numéro, la date et le code de sécurité.');
        setStatus('error');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!HT_PROFILE_ID) {
      setErrorMsg('Configuration de paiement incomplète (Profile ID Moneris manquant).');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    finalizedRef.current = false;

    const orderData: Record<string, unknown> = {
      status: 'pending',
      currency: 'CAD',
      payment_method: 'moneris',
      payment_method_title: 'Moneris',
      ...(coupon ? { coupon_lines: [{ code: coupon.code }] } : {}),
      billing: {
        first_name: form.firstName,
        last_name:  form.lastName,
        email:      form.email,
        phone:      form.phone,
        address_1:  form.address,
        city:       form.city,
        state:      form.province,   // code ISO 2 lettres (QC, ON…)
        postcode:   form.postalCode,
        country:    'CA',            // code ISO pays
      },
      shipping: {
        first_name: form.firstName,
        last_name:  form.lastName,
        address_1:  form.address,
        city:       form.city,
        state:      form.province,
        postcode:   form.postalCode,
        country:    'CA',
      },
      line_items: items.map((i) => ({
        product_id: parseInt(i.product.id),
        quantity:   i.quantity,
      })),
      customer_note: form.notes,
    };

    try {
      // 1) Créer la commande WooCommerce (statut: en attente de paiement)
      const res = await fetch(
        `${wcUrl}/wp-json/wc/v3/orders?consumer_key=${wcKey}&consumer_secret=${wcSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Erreur ${res.status}`);
      }

      const order = await res.json();
      const orderId: number = order.id;

      // 2) Mémoriser le contexte puis demander à l'iframe de tokeniser la carte.
      //    La réponse arrive dans le gestionnaire de message (-> payWithToken).
      pendingRef.current = { orderId, total };
      setOrderInfo({ orderId, total });

      const frame = iframeRef.current?.contentWindow;
      if (!frame) throw new Error('Formulaire de carte non chargé. Recharge la page.');
      frame.postMessage('tokenize', HT_ORIGIN);
    } catch (err: unknown) {
      finalizedRef.current = false;
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setStatus('error');
    }
  }

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900">Paiement</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-neo" /> Commande sécurisée
          </p>
        </div>
      </div>

      <Section className="py-12">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Formulaire livraison */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Informations de livraison</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Prénom" name="firstName" value={form.firstName} onChange={handleChange} required />
                  <Field label="Nom"    name="lastName"  value={form.lastName}  onChange={handleChange} required />
                  <Field label="Courriel" name="email" type="email" value={form.email} onChange={handleChange} required className="sm:col-span-2" />
                  <Field label="Téléphone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                  <Field label="Adresse" name="address" value={form.address} onChange={handleChange} required className="sm:col-span-2" placeholder="123 Rue Exemple" />
                  <Field label="Ville" name="city" value={form.city} onChange={handleChange} required />

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Province</label>
                    <select
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-gray-900"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <Field label="Code postal" name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="H0H 0H0" />

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Instructions spéciales pour ta commande..."
                      className="border border-gray-200 rounded-xl px-4 py-2.5 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-gray-900 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Paiement — formulaire de carte sécurisé (iframe Moneris) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Paiement par carte</h2>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                  <Lock size={13} className="text-neo" /> Tes informations de carte sont saisies dans un formulaire sécurisé Moneris et ne transitent jamais par nos serveurs.
                </p>
                <iframe
                  ref={iframeRef}
                  title="Paiement sécurisé Moneris"
                  src={HT_IFRAME_SRC}
                  className="w-full min-h-[230px] border border-gray-200 rounded-xl"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
              )}
            </div>

            {/* Résumé commande */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Votre commande</h2>

                <div className="flex flex-col gap-3 mb-5">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">x{quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">
                        {(parseFloat(product.price) * quantity).toFixed(2)} $
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span className="font-medium text-gray-900">{subtotal.toFixed(2)} $</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabais ({coupon.code})</span>
                      <span className="font-medium">-{discount.toFixed(2)} $</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>TPS + TVQ</span>
                    <span className="font-medium text-gray-900">{taxes.toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2 mt-1">
                    <span>Total</span>
                    <span>{total.toFixed(2)} $</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mt-6 w-full bg-neo text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neo-600 transition-colors shadow-lg shadow-neo/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading'
                    ? <><Loader2 size={20} className="animate-spin" /> Traitement…</>
                    : <><Lock size={18} /> Confirmer et payer</>
                  }
                </button>

                <p className="mt-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={13} /> Paiement sécurisé par Moneris
                </p>
              </div>
            </div>
          </div>
        </form>
      </Section>
    </>
  );
};

interface FieldProps {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; placeholder?: string; className?: string;
}
function Field({ label, name, value, onChange, type = 'text', required, placeholder, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-neo ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="border border-gray-200 rounded-xl px-4 py-2.5 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-gray-900"
      />
    </div>
  );
}

export default Checkout;
