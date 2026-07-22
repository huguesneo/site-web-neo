'use client';
import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AccountGiftCard {
  number: string;
  balance: number;
  active: boolean;
  expired: boolean;
  expirationDate: string | null;
  origin: 'reçue' | 'achetée';
  recipientEmail: string | null;
  createDate: string | null;
}

/**
 * « Mes cartes-cadeaux » — section de l'espace client. Liste les cartes du
 * client connecté (reçues en cadeau ou achetées) avec leur solde en temps réel.
 * La section ne s'affiche que si le client possède au moins une carte.
 */
const AccountGiftCards: React.FC = () => {
  const [cards, setCards] = useState<AccountGiftCard[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) return;
        const res = await fetch('/api/account/gift-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && Array.isArray(json.cards)) setCards(json.cards);
      } catch { /* section simplement masquée */ }
    })();
    return () => { mounted = false; };
  }, []);

  if (!cards || cards.length === 0) return null;

  async function copyNumber(number: string) {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(number);
      setTimeout(() => setCopied((c) => (c === number ? null : c)), 2000);
    } catch { /* ignore */ }
  }

  function statusBadge(c: AccountGiftCard) {
    if (c.expired) return <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">Expirée</span>;
    if (!c.active) return <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">Désactivée</span>;
    if (c.balance <= 0) return <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">Épuisée</span>;
    return <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">Active</span>;
  }

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neo/10 text-neo shrink-0">
          <Gift size={22} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Mes cartes-cadeaux</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Le solde s'affiche en temps réel. Utilisez le numéro au moment du paiement à la boutique.
      </p>

      <div className="flex flex-col gap-3">
        {cards.map((c) => (
          <div
            key={c.number}
            className="flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-100 rounded-xl p-4 bg-gray-50/60"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-gray-900 tracking-wide">{c.number}</span>
                <button
                  type="button"
                  onClick={() => copyNumber(c.number)}
                  className="text-gray-400 hover:text-neo transition-colors"
                  aria-label="Copier le numéro"
                  title="Copier le numéro"
                >
                  {copied === c.number ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                </button>
                {statusBadge(c)}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {c.origin === 'reçue' ? 'Reçue en cadeau' : 'Achetée'}
                {c.origin === 'achetée' && c.recipientEmail ? ` · envoyée à ${c.recipientEmail}` : ''}
                {c.expirationDate ? ` · expire le ${c.expirationDate.slice(0, 10)}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <span className="block text-xs text-gray-400">Solde</span>
              <span className="text-lg font-extrabold text-neo tracking-tight">{c.balance.toFixed(2)} $</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountGiftCards;
