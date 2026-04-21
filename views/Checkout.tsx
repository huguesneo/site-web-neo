'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, Lock, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Section from '../components/Section';

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
  const { items, subtotal, coupon, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', province: 'QC', postalCode: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'redirecting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [payInfo, setPayInfo] = useState<{ url: string; orderId: number; total: number } | null>(null);
  const [countdown, setCountdown] = useState(4);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const discount = coupon?.discountValue ?? 0;
  const taxes = (subtotal - discount) * 0.14975;
  const total = subtotal - discount + taxes;

  useEffect(() => {
    if (items.length === 0 && status !== 'redirecting') {
      router.push('/boutique');
    }
  }, [items.length, status, router]);

  if (items.length === 0 && status !== 'redirecting') {
    return null;
  }

  // ─── Écran de transition vers Moneris ───────────────────────────────────────
  if (status === 'redirecting' && payInfo) {
    const circumference = 2 * Math.PI * 26; // rayon 26
    const progress = (countdown / 4) * circumference;
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full animate-fade-in">

          {/* Icône succès */}
          <div className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={38} className="text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Commande confirmée !</h1>
          <p className="text-gray-400 text-sm mb-1">Commande #{payInfo.orderId}</p>
          <p className="text-neo text-2xl font-extrabold mb-8 tracking-tight">
            {payInfo.total.toFixed(2)} $
          </p>

          {/* Countdown circulaire */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="#374151" strokeWidth="4" />
              <circle
                cx="30" cy="30" r="26" fill="none"
                stroke="#00BBB1" strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
              {countdown}
            </span>
          </div>

          <p className="text-gray-400 text-sm mb-8">
            Redirection automatique vers le paiement sécurisé…
          </p>

          {/* Bouton immédiat */}
          <a
            href={payInfo.url}
            onClick={() => clearInterval(countdownRef.current!)}
            className="inline-flex items-center gap-2 bg-neo hover:bg-neo-600 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-neo/25 mb-6"
          >
            Payer maintenant <ArrowRight size={17} />
          </a>

          {/* Badges sécurité */}
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const wcKey    = process.env.NEXT_PUBLIC_WC_KEY_RW    || process.env.NEXT_PUBLIC_WC_KEY;
    const wcSecret = process.env.NEXT_PUBLIC_WC_SECRET_RW || process.env.NEXT_PUBLIC_WC_SECRET;
    const wcUrl    = process.env.NEXT_PUBLIC_WC_URL;

    const orderData: Record<string, unknown> = {
      status: 'pending',
      currency: 'CAD',
      payment_method: 'moneris_checkout_woocommerce',
      payment_method_title: 'Moneris Checkout',
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

      const payUrl: string =
        order.payment_url ||
        `${wcUrl}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

      clearCart();
      setPayInfo({ url: payUrl, orderId: order.id, total });
      setStatus('redirecting');
      setCountdown(4);

      // Countdown 4→0 puis redirect automatique
      let count = 4;
      countdownRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownRef.current!);
          window.location.href = payUrl;
        }
      }, 1000);
    } catch (err: unknown) {
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

              {/* Paiement */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Paiement</h2>
                <div className="flex items-center gap-3 bg-neo/5 border border-neo/20 rounded-xl p-4">
                  <Lock size={20} className="text-neo shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Moneris Checkout</p>
                    <p className="text-xs text-gray-500">Ta commande sera créée et tu seras redirigé vers le formulaire de paiement sécurisé Moneris.</p>
                  </div>
                </div>
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
