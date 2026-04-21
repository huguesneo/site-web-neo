'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Loader2, ArrowRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Prompt système NEO Performance ───────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de NEO Performance, une clinique naturopathique basée à Brossard, Québec, Canada. Tu t'appelles "Neo".

MISSION : Répondre aux questions sur NEO Performance de façon chaleureuse, professionnelle et naturelle, comme un vrai membre de l'équipe. Tu parles français uniquement (sauf si le client t'écrit en anglais).

INFORMATIONS SUR NEO PERFORMANCE :

🏥 QUI SOMMES-NOUS
- Clinique naturopathique à Brossard, Québec
- 11 ans d'expertise en optimisation de la santé
- Plus de 15 000 personnes aidées
- Plus de 4 000 avis 5 étoiles, note moyenne de 4,9/5
- Approche intégrative et scientifique (pas de diètes classiques ou de remèdes génériques)

👥 L'ÉQUIPE
- Hugues Pugliese — Fondateur & Naturopathe, spécialiste en optimisation métabolique, santé digestive, performance cognitive, gestion du stress chronique
- Thibault Van Elsue — Naturopathe & Ostéopathe, spécialiste en biomécanique, douleurs chroniques, récupération sportive, équilibre structurel
- Jessica Emond — Naturopathe, spécialiste en santé de la femme, hormones féminines, fertilité, énergie & vitalité
- Tamara Ovayan — Naturopathe, spécialiste en digestion & immunité, microbiote, allergies, détoxification
- Brice Duvalet — Naturothérapeute, spécialiste en hygiène de vie, sommeil, nutrition sportive, coaching de vie

🩺 SERVICES
- Évaluation Métabolique en virtuel (60 min via Google Meet) — Bilan métabolique 360°, révision digestion/stress/hormones, plan d'action en direct
- Évaluation Métabolique en clinique (60 min à Brossard) — Inclut analyse InBody (composition corporelle : % gras, masse musculaire, hydratation), rencontre privée, plan de match
- Consultations de suivi naturopathiques
- Quiz de santé personnalisé disponible sur le site

💊 BOUTIQUE
- Suppléments de qualité clinique sélectionnés par les naturopathes
- Marques professionnelles (ex: Designs for Health)
- Livraison 24/48h, checkout sécurisé
- Catégories : suppléments, santé générale, et plus

📅 RENDEZ-VOUS
- Consultation initiale gratuite de 30 minutes disponible
- Booking en ligne sur le site (/consultation)
- Deux formats : virtuel (Google Meet) ou en clinique à Brossard

RÈGLES DE COMPORTEMENT :
1. Sois chaleureux, naturel et humain — pas robotique
2. Réponds de façon concise (2-4 phrases max sauf si on te demande plus de détails)
3. Si quelqu'un veut prendre rendez-vous ou parle de consultation, réponds avec enthousiasme et invite-les à cliquer sur le lien de prise de rendez-vous (tu peux mentionner "[LIEN_RDV]" dans ta réponse)
4. Si quelqu'un parle d'un symptôme ou d'un problème de santé, valide leur ressenti, explique brièvement comment NEO peut aider, et propose une consultation
5. Ne donne jamais de conseils médicaux précis ou de diagnostics — oriente toujours vers une consultation
6. Pour les questions sur les produits de la boutique, oriente vers la boutique ([LIEN_BOUTIQUE])
7. Si tu ne sais pas quelque chose, dis-le honnêtement et propose de contacter l'équipe directement
8. Utilise des emojis avec parcimonie pour rester professionnel mais accessible
9. Tutoie le client (c'est la culture de NEO)`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Quels services offrez-vous ?",
  "Comment fonctionne l'évaluation métabolique ?",
  "Je veux prendre rendez-vous",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !started) {
      setStarted(true);
      setMessages([{
        role: 'assistant',
        content: 'Bonjour ! 👋 Je suis Neo, l\'assistant de NEO Performance. Comment puis-je t\'aider aujourd\'hui ?'
      }]);
    }
  }, [open, started]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  async function sendMessage(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        throw new Error('Clé API manquante');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      // Historique des 10 derniers messages — Gemini exige que ça commence par 'user'
      const rawHistory = messages.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const firstUser = rawHistory.findIndex((m) => m.role === 'user');
      const history = firstUser >= 0 ? rawHistory.slice(firstUser) : [];

      const chat = model.startChat({ history });

      const result = await chat.sendMessage(userText);
      const responseText = result.response.text();

      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      console.error('[Chatbot] Gemini error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Désolé, je rencontre un problème technique. Tu peux nous contacter directement via la page Contact ou prendre rendez-vous en ligne. 😊'
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // Rendu du contenu avec liens cliquables
  function renderContent(text: string) {
    const parts = text.split(/(\[LIEN_RDV\]|\[LIEN_BOUTIQUE\])/g);
    return parts.map((part, i) => {
      if (part === '[LIEN_RDV]') {
        return (
          <Link key={i} href="/consultation" onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 bg-neo text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neo/90 transition-colors mx-1">
            Prendre rendez-vous <ArrowRight size={12} />
          </Link>
        );
      }
      if (part === '[LIEN_BOUTIQUE]') {
        return (
          <Link key={i} href="/boutique" onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neo transition-colors mx-1">
            Voir la boutique <ArrowRight size={12} />
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-gray-900 scale-90' : 'bg-neo hover:scale-110'
        }`}
        aria-label="Chat avec Neo"
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={24} className="text-white" />
        }
        {/* Badge notification quand fermé */}
        {!open && !started && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Fenêtre de chat */}
      <div className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] transition-all duration-300 origin-bottom-right ${
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-neo to-neo/80 px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
              N
            </div>
            <div>
              <p className="text-white font-bold text-sm">Neo</p>
              <p className="text-white/70 text-xs">Assistant NEO Performance</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/70 text-xs">En ligne</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-neo/10 text-neo flex items-center justify-center text-xs font-black mr-2 mt-1 shrink-0">N</div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-neo text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-neo/10 text-neo flex items-center justify-center text-xs font-black mr-2 mt-1 shrink-0">N</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Questions suggérées (seulement au début) */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-neo/10 text-neo font-medium px-3 py-1.5 rounded-full hover:bg-neo hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question…"
              disabled={loading}
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-neo rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-neo/90 transition-colors shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
