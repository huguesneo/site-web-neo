'use client';
import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Loader2, Package, ArrowLeft, Truck, ShoppingBag, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../services/supabaseClient';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  total: number;
  image: string | null;
}
interface Order {
  id: number;
  number: string;
  status: string;
  dateCreated: string;
  total: number;
  currency: string;
  discountTotal: number;
  shippingTotal: number;
  tracking: { provider?: string; number?: string; url?: string } | null;
  items: OrderItem[];
}

// Étiquettes FR + couleur pour chaque statut WooCommerce.
const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente de paiement', className: 'bg-amber-50 text-amber-700' },
  'on-hold': { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  processing: { label: 'En traitement', className: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Complétée', className: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'Remboursée', className: 'bg-gray-100 text-gray-600' },
  failed: { label: 'Échouée', className: 'bg-red-50 text-red-700' },
};

function statusMeta(status: string) {
  return STATUS_META[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
}

const money = (n: number, currency = 'CAD') =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(n);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

const AccountOrders: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  // Lit la session, puis va chercher les commandes via la route serveur sécurisée.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setUser(session?.user ?? null);
      setCheckingSession(false);
      if (!session?.access_token) return;

      setLoading(true);
      try {
        const res = await fetch('/api/account/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: session.access_token }),
        });
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(json.error || 'Impossible de récupérer vos commandes.');
        } else {
          setOrders(json.orders ?? []);
        }
      } catch {
        if (mounted) setError('Une erreur est survenue. Réessayez dans un instant.');
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <section className="min-h-[60vh] bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-neo" />
      </section>
    );
  }

  // Non connecté : on invite à se connecter (la page commande est privée).
  if (!user) {
    return (
      <div className="bg-white min-h-[60vh] pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neo/10 text-neo mb-4">
            <Package size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Vos commandes</h1>
          <p className="text-gray-600 mb-6">
            Connectez-vous à votre espace client pour consulter l'historique de vos commandes.
          </p>
          <Button to="/espace-client">Se connecter</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/espace-client"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-neo mb-4"
          >
            <ArrowLeft size={16} /> Retour à l'espace client
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Mes commandes</h1>
          <p className="mt-2 text-gray-600">Historique de vos achats à la boutique NEO Performance.</p>
        </div>
      </div>

      <div className="bg-white py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-neo" />
            </div>
          )}

          {!loading && error && (
            <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 rounded-xl p-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && orders && orders.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                <ShoppingBag size={26} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Aucune commande pour l'instant</h2>
              <p className="mt-1.5 text-gray-500 max-w-sm mx-auto">
                Les commandes passées avec le courriel de votre compte apparaîtront ici.
              </p>
              <div className="mt-6">
                <Button to="/boutique">Visiter la boutique</Button>
              </div>
            </div>
          )}

          {!loading && !error && orders && orders.length > 0 && (
            <div className="space-y-5">
              {orders.map((order) => {
                const meta = statusMeta(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 overflow-hidden"
                  >
                    {/* En-tête : numéro, date, statut */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Commande #{order.number}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.dateCreated)}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold rounded-full px-3 py-1 ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Articles */}
                    <div className="px-5 py-4 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">Quantité : {item.quantity}</p>
                          </div>
                          <p className="text-sm text-gray-700 shrink-0">
                            {money(item.total, order.currency)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Suivi de livraison (si disponible) */}
                    {order.tracking?.number && (
                      <div className="px-5 py-3 border-t border-gray-100 bg-neo-50/50 flex items-center gap-2 text-sm text-neo-900">
                        <Truck size={16} className="text-neo shrink-0" />
                        <span>
                          Suivi :{' '}
                          {order.tracking.url ? (
                            <a
                              href={order.tracking.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline"
                            >
                              {order.tracking.number}
                            </a>
                          ) : (
                            <span className="font-semibold">{order.tracking.number}</span>
                          )}
                          {order.tracking.provider ? ` (${order.tracking.provider})` : ''}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-base font-bold text-gray-900">
                        {money(order.total, order.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountOrders;
