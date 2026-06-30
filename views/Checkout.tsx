'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, Lock, Package, Tag } from 'lucide-react';
import { useCart, cartLineId, itemUnitPrice, itemImage } from '../contexts/CartContext';
import { supabase } from '../services/supabaseClient';
import Section from '../components/Section';
import { isDigitalProduct } from '../constants';

// ─── Moneris Hosted Tokenization (iframe sécurisée) ─────────────────────────────
const HT_IS_PROD = process.env.NEXT_PUBLIC_MONERIS_ENV === 'prod';
const HT_HOST = HT_IS_PROD ? 'https://www3.moneris.com' : 'https://esqa.moneris.com';
const HT_ORIGIN = `${HT_HOST}/HPPtoken/index.php`;
const HT_PROFILE_ID = process.env.NEXT_PUBLIC_MONERIS_HT_PROFILE_ID || '';

// URL de l'iframe Hosted Tokenization : labels FR, champs stylés, responsive.
// Doc Moneris : pan_label/exp_label/cvd_label (texte), css_* (style), enable_*_formatting.
const HT_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const HT_INPUT_CSS =
  `box-sizing:border-box;width:100%;margin:0 0 4px;padding:13px 14px;` +
  `font-size:16px;font-family:${HT_FONT};color:#111827;background:#fff;` +
  `border:1px solid #d1d5db;border-radius:12px;outline:none;`;
const HT_LABEL_CSS =
  `display:block;margin:14px 0 6px;font-size:13px;font-weight:600;` +
  `color:#374151;font-family:${HT_FONT};`;

const HT_IFRAME_SRC = (() => {
  const p = new URLSearchParams({
    id: HT_PROFILE_ID,
    pmmsg: 'true',
    enable_exp: '1',
    enable_cvd: '1',
    enable_cc_formatting: '1',
    enable_exp_formatting: '1',
    display_labels: '1',
    pan_label: 'Numéro de carte',
    exp_label: 'Expiration (MM/AA)',
    cvd_label: 'Code de sécurité (CVD)',
    css_body: `margin:0;padding:0;background:transparent;font-family:${HT_FONT};`,
    css_input_label: HT_LABEL_CSS,
    css_textbox: HT_INPUT_CSS,
    css_textbox_pan: HT_INPUT_CSS,
    css_textbox_exp: HT_INPUT_CSS,
    css_textbox_cvd: HT_INPUT_CSS,
  });
  return `${HT_HOST}/HPPtoken/index.php?${p.toString()}`;
})();

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
  const { items, subtotal, isClient, clientDiscount, giftCardDiscount, shipping, coupon, applyCoupon, removeCoupon, clearCart, hydrated } = useCart();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [couponError, setCouponError] = useState('');

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponStatus('loading');
    setCouponError('');
    try {
      await applyCoupon(couponInput);
      setCouponStatus('idle');
      setCouponInput('');
    } catch (e: unknown) {
      setCouponError(e instanceof Error ? e.message : 'Code invalide.');
      setCouponStatus('error');
    }
  }

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', province: 'QC', postalCode: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId: number; total: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Contexte de la commande en cours, lu par le gestionnaire de message de l'iframe
  const pendingRef = useRef<{
    orderId: number;
    total: number;
    customer: { firstName: string; lastName: string; email: string; phone: string };
  } | null>(null);
  const finalizedRef = useRef(false);

  // Estimation affichée avant soumission. Le montant RÉEL facturé est celui que
  // WooCommerce recalcule côté serveur (prix réels + taxes + rabais).
  const couponDiscount = coupon?.discountValue ?? 0;
  const totalDiscount = clientDiscount + giftCardDiscount + couponDiscount;
  const netGoods = subtotal - totalDiscount;
  // Seuls les produits physiques sont taxables (carte-cadeau et suivis exclus).
  const digitalSubtotal = items
    .filter((i) => isDigitalProduct(i.product))
    .reduce((s, i) => s + itemUnitPrice(i) * i.quantity, 0);
  const taxableBase = Math.max(0, netGoods - digitalSubtotal) + shipping;
  const taxes = taxableBase * 0.14975;
  const total = netGoods + shipping + taxes;

  useEffect(() => {
    if (hydrated && items.length === 0 && status === 'idle') {
      router.push('/boutique');
    }
  }, [hydrated, items.length, status, router]);

  // Pré-remplit les coordonnées avec celles du compte connecté (sans écraser une
  // saisie en cours) : courriel (depuis Supabase Auth) puis prénom, nom et
  // téléphone (depuis la fiche `clients`, associée par courriel — même donnée
  // que l'application de suivi). Garantit aussi que la commande sera reliée à
  // l'espace client, où le client retrouve l'historique de ses commandes.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const accountEmail = data.session?.user?.email;
      if (!mounted || !accountEmail) return;

      // 1) Courriel du compte tout de suite.
      setForm((prev) => (prev.email.trim() ? prev : { ...prev, email: accountEmail }));

      // 2) Prénom / nom / téléphone depuis la fiche client (si elle existe ;
      //    une personne sans dossier clinique n'aura pas de ligne ici).
      const { data: client } = await supabase
        .from('clients')
        .select('first_name, last_name, phone')
        .eq('email', accountEmail)
        .maybeSingle();
      if (!mounted || !client) return;

      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName.trim() ? prev.firstName : (client.first_name ?? '').trim(),
        lastName: prev.lastName.trim() ? prev.lastName : (client.last_name ?? '').trim(),
        phone: prev.phone.trim() ? prev.phone : (client.phone ?? '').trim(),
      }));
    });

    return () => {
      mounted = false;
    };
  }, []);

  // ─── Écoute la réponse de l'iframe Hosted Tokenization ──────────────────────
  // (placé ici, avant tout return anticipé, pour respecter l'ordre des hooks)
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

  // ─── Étape 3 : encaisser avec le token reçu de l'iframe ─────────────────────
  async function payWithToken(temporaryToken: string) {
    const ctx = pendingRef.current;
    if (!ctx || finalizedRef.current) return;
    finalizedRef.current = true;
    try {
      // Aucun montant envoyé : le serveur relit le total réel depuis WooCommerce.
      const payRes = await fetch('/api/moneris/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temporaryToken,
          orderId: ctx.orderId,
          customer: ctx.customer,
        }),
      });
      const pay = await payRes.json();
      if (!payRes.ok || !pay.approved) {
        throw new Error(pay.error || 'Le paiement a été refusé.');
      }
      // La commande est marquée payée côté serveur après encaissement.

      clearCart();
      setOrderInfo({ orderId: ctx.orderId, total: ctx.total });
      setStatus('success');
    } catch (e: unknown) {
      finalizedRef.current = false;
      setErrorMsg(e instanceof Error ? e.message : 'Erreur lors du paiement.');
      setStatus('error');
    }
  }


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

    const billing = {
      first_name: form.firstName,
      last_name:  form.lastName,
      email:      form.email,
      phone:      form.phone,
      address_1:  form.address,
      city:       form.city,
      state:      form.province,   // code ISO 2 lettres (QC, ON…)
      postcode:   form.postalCode,
      country:    'CA',            // code ISO pays
    };
    const shipping = {
      first_name: form.firstName,
      last_name:  form.lastName,
      address_1:  form.address,
      city:       form.city,
      state:      form.province,
      postcode:   form.postalCode,
      country:    'CA',
    };

    try {
      // Jeton de session : preuve qu'il s'agit d'un client connecté (→ rabais -13 %).
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;

      // 1) Créer la commande CÔTÉ SERVEUR. Le serveur vérifie la session,
      //    applique les rabais et laisse WooCommerce calculer le vrai total.
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: parseInt(i.product.id),
            ...(i.variation ? { variation_id: i.variation.id } : {}),
            quantity: i.quantity,
          })),
          billing,
          shipping,
          customer_note: form.notes,
          couponCode: coupon?.code ?? null,
          accessToken,
        }),
      });

      const order = await res.json();
      if (!res.ok) {
        throw new Error(order.error || `Erreur ${res.status}`);
      }

      const orderId: number = order.id ?? order.orderId;
      const authoritativeTotal: number = Number.isFinite(order.total) ? order.total : total;

      // 2) Mémoriser le contexte puis demander à l'iframe de tokeniser la carte.
      //    La réponse arrive dans le gestionnaire de message (-> payWithToken).
      pendingRef.current = {
        orderId,
        total: authoritativeTotal,
        customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
      };
      setOrderInfo({ orderId, total: authoritativeTotal });

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
                  scrolling="no"
                  className="w-full h-[290px] border-0 bg-transparent"
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
                  {items.map((item) => {
                    const { product, quantity, variation } = item;
                    const img = itemImage(item);
                    return (
                    <div key={cartLineId(product.id, variation?.id)} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        {img && <img src={img} alt={product.name} className="w-full h-full object-contain p-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">{variation ? `${variation.label} · ` : ''}x{quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">
                        {(itemUnitPrice(item) * quantity).toFixed(2)} $
                      </span>
                    </div>
                    );
                  })}
                </div>

                {/* Code promo */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                        <Tag size={14} /> {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-gray-500 hover:text-red-600 font-medium"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Code promo</label>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                          placeholder="Entre ton code"
                          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponStatus === 'loading' || !couponInput.trim()}
                          className="px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {couponStatus === 'loading' ? '…' : 'Appliquer'}
                        </button>
                      </div>
                      {couponStatus === 'error' && (
                        <p className="text-xs text-red-600 mt-1.5">{couponError}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span className="font-medium text-gray-900">{subtotal.toFixed(2)} $</span>
                  </div>
                  {isClient && clientDiscount > 0 && (
                    <div className="flex justify-between text-neo">
                      <span className="font-medium">Rabais client (−13 %)</span>
                      <span className="font-medium">-{clientDiscount.toFixed(2)} $</span>
                    </div>
                  )}
                  {isClient && giftCardDiscount > 0 && (
                    <div className="flex justify-between text-neo">
                      <span className="font-medium">Rabais carte-cadeau client</span>
                      <span className="font-medium">-{giftCardDiscount.toFixed(2)} $</span>
                    </div>
                  )}
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Rabais ({coupon.code})</span>
                      <span className="font-medium">-{couponDiscount.toFixed(2)} $</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    {shipping > 0 ? (
                      <span className="font-medium text-gray-900">{shipping.toFixed(2)} $</span>
                    ) : (
                      <span className="font-bold text-neo">Gratuite</span>
                    )}
                  </div>
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
