'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, ArrowRight, Mail, ChevronLeft, ShoppingCart, CheckCircle, Lock, LogIn } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useGHLProducts } from '../hooks/useGHLProducts';
import { GHLProduct } from '../data/ghlProducts';
import { supabase } from '../services/supabaseClient';

// Webhook Make.com qui reçoit les demandes de contact (partagé avec la page Contact)
const CONTACT_WEBHOOK = 'https://hook.us1.make.com/9zzcxgr29wn6l6feb2p6qxjgj6teklxi';

// Événement global déclenché par la boutique pour ouvrir Léo en mode conseil produits
export const OPEN_LEO_ADVISOR_EVENT = 'neo:open-leo-advisor';

// Les prompts système de Léo vivent côté serveur (lib/leo-prompts.ts) : le
// client n'envoie qu'un `mode` à /api/chat (+ le catalogue en mode conseil).

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ChatMode = 'support' | 'advisor';

interface ChatbotProps {
  /** Mode intégré dans une page (toujours ouvert, remplit son conteneur, sans bouton flottant) */
  embedded?: boolean;
}

const EMPTY_HUMAN_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
};

const SUPPORT_GREETING = 'Bonjour ! 👋 Je suis Léo, l\'assistant virtuel de NEO Performance. Comment puis-je t\'aider aujourd\'hui ?';
const ADVISOR_GREETING = 'Salut ! 👋 Moi c\'est Léo. Je vais t\'aider à trouver les suppléments parfaits pour toi. 💪\n\nAvant tout : es-tu déjà client(e) chez NEO Performance ? [CHOIX:Oui, je suis déjà client|Non, pas encore]';

// ─── Composant ────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Pouvez-vous m'aider avec mon énergie ?",
  "Comment fonctionne votre accompagnement ?",
  "Je veux prendre rendez-vous",
];

// Extrait les options d'un marqueur [CHOIX:a|b|c]
function parseChoices(text: string): string[] {
  const match = text.match(/\[CHOIX:([^\]]+)\]/);
  if (!match) return [];
  return match[1].split('|').map((s) => s.trim()).filter(Boolean).slice(0, 4);
}

// Extrait les identifiants des marqueurs [PRODUIT:id]
function parseProductIds(text: string): string[] {
  const ids: string[] = [];
  const re = /\[PRODUIT:([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    ids.push(m[1].trim());
  }
  return ids;
}

// Le chat affiche du texte brut : si Gemini glisse du markdown malgré la
// consigne du prompt, on le convertit en texte propre plutôt que d'afficher
// les astérisques au client.
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]*\)/g, '$1') // [texte](url) → texte
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // **gras** / __gras__
    .replace(/(^|\s)\*(?!\s)([^*\n]+)\*(?=[\s.,!?;:]|$)/g, '$1$2') // *italique*
    .replace(/^#{1,6}\s+/gm, '') // # Titres
    .replace(/^\s*[*•-]\s+/gm, '• ') // puces * ou - → •
    .replace(/`([^`]+)`/g, '$1'); // `code`
}

// Retire les marqueurs purement « machine » du texte affiché
function stripMachineMarkers(text: string): string {
  return stripMarkdown(text)
    .replace(/\[CHOIX:[^\]]+\]/g, '')
    .replace(/\[PRODUIT:[^\]]+\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Flux « client NEO » (plan de suppléments depuis Supabase) ─────────────────

// Réponses exactes du premier choix de l'accueil conseil (doivent matcher ADVISOR_GREETING)
const CLIENT_YES = 'Oui, je suis déjà client';

// Question d'objectif réutilisée quand on retombe sur le conseil « invité »
const GUEST_FALLBACK_CHOICES = '[CHOIX:Plus d\'énergie|Perte de poids|Meilleure digestion|Autre (j\'écris)]';

interface SuppBlock { timing: string; text: string }

// Convertit le HTML brouillon des naturopathes en texte propre, ligne par ligne.
function htmlToText(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

// Extrait les blocs de suppléments non vides depuis data.suppsBlocks
function extractSuppBlocks(suppsBlocks: unknown): SuppBlock[] {
  if (!Array.isArray(suppsBlocks)) return [];
  return suppsBlocks
    .map((b) => ({ timing: String(b?.title || '').trim(), text: htmlToText(String(b?.text || '')) }))
    .filter((b) => b.text.length > 0);
}

// Repli : matching d'un nom de supplément au catalogue par chevauchement de mots
// (utilisé seulement si Gemini ne renvoie pas d'id valide).
function fuzzyMatchProduct(name: string, catalog: GHLProduct[]): GHLProduct | null {
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
  const words = norm(name).split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return null;
  let best: GHLProduct | null = null;
  let bestScore = 0;
  for (const p of catalog) {
    const pn = norm(p.name);
    const score = words.reduce((acc, w) => acc + (pn.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 1 ? best : null;
}

export default function Chatbot({ embedded = false }: ChatbotProps) {
  const pathname = usePathname();
  const { addItem } = useCart();
  const { products } = useGHLProducts();
  const [open, setOpen] = useState(embedded);
  const [mode, setMode] = useState<ChatMode>('support');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  // Formulaire « parler à un humain » dans la fenêtre de clavardage
  const [humanForm, setHumanForm] = useState<'closed' | 'open' | 'sending' | 'sent'>('closed');
  const [humanFields, setHumanFields] = useState(EMPTY_HUMAN_FORM);
  const [humanConsent, setHumanConsent] = useState(false);
  // Connexion « client NEO » directement dans le chat (pour récupérer son plan de suppléments)
  const [clientLogin, setClientLogin] = useState<'idle' | 'form' | 'authing' | 'fetching'>('idle');
  // Catalogue transmis par la boutique (SSR) à l'ouverture du conseil. Prioritaire
  // sur le fetch /api/products : il est garanti présent dès l'ouverture de Léo.
  const [advisorProducts, setAdvisorProducts] = useState<GHLProduct[]>([]);
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Catalogue effectif : priorité aux produits SSR fournis par la boutique
  // (toujours présents), repli sur le fetch /api/products (autres contextes).
  const catalog = advisorProducts.length ? advisorProducts : products;

  // Map id -> produit pour résoudre les marqueurs [PRODUIT:id]
  const productById = React.useMemo(() => {
    const map = new Map<string, GHLProduct>();
    for (const p of catalog) map.set(p.id, p);
    return map;
  }, [catalog]);

  // Référence toujours à jour du catalogue : permet d'attendre son chargement
  // dans les fonctions asynchrones (sinon « course » → catalogue vide au matching).
  const productsRef = useRef<GHLProduct[]>(catalog);
  productsRef.current = catalog;

  // Ouvre Léo en mode conseil produits depuis la boutique
  useEffect(() => {
    function handleOpenAdvisor(e: Event) {
      // La boutique transmet son catalogue SSR → Léo l'utilise directement.
      const detail = (e as CustomEvent<{ products?: GHLProduct[] }>).detail;
      if (detail?.products?.length) setAdvisorProducts(detail.products);
      setMode('advisor');
      setStarted(true);
      setHumanForm('closed');
      setMessages([{ role: 'assistant', content: ADVISOR_GREETING }]);
      setOpen(true);
    }
    window.addEventListener(OPEN_LEO_ADVISOR_EVENT, handleOpenAdvisor);
    return () => window.removeEventListener(OPEN_LEO_ADVISOR_EVENT, handleOpenAdvisor);
  }, []);

  // Le mode conseil est UNIQUE à la boutique. Dès qu'on quitte /boutique, on
  // revient au Léo support classique (petite bulle flottante) sur les autres pages.
  useEffect(() => {
    if (pathname !== '/boutique' && mode === 'advisor') {
      setMode('support');
      setOpen(false);
      setStarted(false);
      setMessages([]);
    }
  }, [pathname, mode]);

  useEffect(() => {
    if (open && !started) {
      setStarted(true);
      setMessages([{ role: 'assistant', content: SUPPORT_GREETING }]);
    }
  }, [open, started]);

  useEffect(() => {
    // Faire défiler uniquement la boîte de messages, jamais la page entière
    // (sinon en mode intégré la page Contact saute jusqu'au chatbot).
    const container = messagesEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    // preventScroll: le focus ne doit pas faire défiler la page jusqu'au champ.
    if (open) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 300);
  }, [open]);

  const pushAssistant = (content: string) =>
    setMessages((prev) => [...prev, { role: 'assistant', content }]);

  // Appel Gemini renvoyant du JSON strict (pour l'extraction/matching des suppléments)
  async function geminiJson(prompt: string): Promise<unknown> {
    const res = await fetch('/api/gemini-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`gemini-json: ${res.status}`);
    const data = await res.json();
    return data.result;
  }

  // Associe les suppléments du plan (texte brouillon) aux produits du catalogue.
  async function matchSuppsToCatalog(blocks: SuppBlock[], cat: GHLProduct[]): Promise<
    { name: string; brand: string; quantity: string; timing: string; productId: string | null }[]
  > {
    const catalog = cat.map((p) => `${p.id} :: ${p.name}`).join('\n');
    const planText = blocks.map((b) => `[${b.timing || 'Moment non précisé'}]\n${b.text}`).join('\n\n');
    const prompt = `Tu associes les suppléments d'un plan naturopathique au catalogue d'une boutique en ligne.

PLAN (texte brut rédigé par le naturopathe : peut contenir des fautes, des abréviations et la marque entre parenthèses, ex. (DFH) = Designs for Health, (EVO) = Evo Lab) :
${planText}

CATALOGUE (format "id :: nom") :
${catalog || '(catalogue indisponible)'}

Pour CHAQUE supplément distinct réellement prescrit dans le plan (IGNORE les notes qui ne sont pas des suppléments, ex. « finir le pot », « on continue X une fois fini »), renvoie un objet avec :
- "name" : le nom du supplément tel qu'écrit dans le plan (sans la marque ni la quantité)
- "brand" : la marque indiquée dans le plan si présente (ex. "Evo Lab" pour (EVO)/EVO, "Designs for Health" pour (DFH)/DFH), sinon ""
- "quantity" : la posologie indiquée (ex. « 1 capsule »), sinon ""
- "timing" : le moment (titre du bloc, ex. « Au déjeuner »), sinon ""
- "productId" : l'id EXACT du produit du catalogue qui correspond le mieux. RÈGLE IMPORTANTE : si une marque est indiquée, choisis EN PRIORITÉ le produit de CETTE marque (ex. "oméga 3 (EVO)" → le produit "Evo Lab - Omega 3", PAS un oméga d'une autre marque). Tolère fautes et abréviations. Si AUCUN produit ne correspond raisonnablement, mets null. N'invente jamais un id absent du catalogue.

Réponds UNIQUEMENT par un tableau JSON.`;
    const arr = await geminiJson(prompt);
    return Array.isArray(arr) ? (arr as { name: string; brand: string; quantity: string; timing: string; productId: string | null }[]) : [];
  }

  // Va chercher le plan du client connecté dans Supabase, puis présente ses suppléments.
  async function fetchClientPlan(email: string) {
    setClientLogin('fetching');
    setLoading(true);
    try {
      // 1) Dossier client par courriel
      const { data: client } = await supabase
        .from('clients')
        .select('id, first_name, leo_enabled')
        .ilike('email', email)
        .maybeSingle();

      if (!client) {
        pushAssistant(
          `Hmm, je ne trouve pas de dossier avec ce courriel 🤔 Vérifie que c'est bien celui de ton compte NEO. En attendant, je peux te conseiller comme un nouveau client — c'est quoi ton objectif principal ? ${GUEST_FALLBACK_CHOICES}`
        );
        return;
      }
      if (client.leo_enabled === false) {
        pushAssistant(
          `L'accès à ton plan personnalisé via Léo n'est pas encore activé sur ton compte. Mais je peux quand même te recommander d'excellents suppléments ! Quel est ton objectif principal ? ${GUEST_FALLBACK_CHOICES}`
        );
        return;
      }

      const prenom = (client.first_name || '').trim();

      // 2) Plans du client, du plus récent au plus ancien
      const { data: plans } = await supabase
        .from('plans')
        .select('id, title, latest_version, updated_at, created_at')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false });

      // 3) Premier plan (le plus récent) qui contient réellement des suppléments
      let chosenTitle = '';
      let blocks: SuppBlock[] = [];
      for (const plan of plans || []) {
        const { data: ver } = await supabase
          .from('plan_versions')
          .select('data')
          .eq('plan_id', plan.id)
          .eq('version', plan.latest_version)
          .maybeSingle();
        const extracted = extractSuppBlocks((ver?.data as { suppsBlocks?: unknown })?.suppsBlocks);
        if (extracted.length) {
          chosenTitle = plan.title || '';
          blocks = extracted;
          break;
        }
      }

      if (!blocks.length) {
        pushAssistant(
          `Je ne trouve pas de suppléments dans ton plan actuel${prenom ? `, ${prenom}` : ''}. Veux-tu que je te conseille selon ton objectif ? ${GUEST_FALLBACK_CHOICES}`
        );
        return;
      }

      // 4) S'assurer que le catalogue est chargé AVANT de matcher (sinon course →
      //    catalogue vide → tout marqué « absent » alors que les produits existent).
      let catalog = productsRef.current;
      for (let i = 0; i < 25 && catalog.length === 0; i++) {
        await new Promise((r) => setTimeout(r, 200));
        catalog = productsRef.current;
      }
      if (catalog.length === 0) {
        pushAssistant(
          `Je finis de charger notre catalogue… réessaie dans quelques secondes, ${prenom || 'on y est presque'} 🙏`
        );
        return;
      }
      const catById = new Map(catalog.map((p) => [p.id, p]));

      // 5) Extraction + matching au catalogue via Gemini
      const items = await matchSuppsToCatalog(blocks, catalog);

      // 6) Construction du message : récap (nom/quantité/moment), cartes produits, indispos
      const matched: { item: typeof items[number]; product: GHLProduct }[] = [];
      const unmatched: typeof items = [];
      for (const it of items) {
        // Gemini renvoie parfois l'id en nombre → forcer la chaîne (les clés sont des chaînes)
        const pid = it.productId == null ? null : String(it.productId);
        // Repli par nom (marque incluse pour privilégier le bon produit, ex. oméga 3 Evo Lab)
        const product =
          (pid && catById.get(pid)) ||
          fuzzyMatchProduct(`${it.name} ${it.brand || ''}`.trim(), catalog) ||
          undefined;
        if (product) matched.push({ item: it, product });
        else unmatched.push(it);
      }

      if (!matched.length && !unmatched.length) {
        pushAssistant(
          `J'ai trouvé ton plan « ${chosenTitle} » mais je n'arrive pas à en extraire les suppléments. Veux-tu que je te conseille selon ton objectif ? ${GUEST_FALLBACK_CHOICES}`
        );
        return;
      }

      const recap = [...matched.map((m) => m.item), ...unmatched]
        .map((it) => {
          const details = [it.quantity, it.timing].filter(Boolean).join(' · ');
          return `• ${it.name}${details ? ` — ${details}` : ''}`;
        })
        .join('\n');

      // Produits uniques pour les cartes / « tout ajouter »
      const seen = new Set<string>();
      const productMarkers = matched
        .filter((m) => !seen.has(m.product.id) && seen.add(m.product.id))
        .map((m) => `[PRODUIT:${m.product.id}]`)
        .join('\n');

      let msg = `Parfait${prenom ? ` ${prenom}` : ''} ! 🙌 Voici les suppléments de ton plan « ${chosenTitle} » :\n\n${recap}`;
      if (productMarkers) {
        msg += `\n\nVoici ceux qu'on a en boutique 👇\n${productMarkers}`;
      }
      if (unmatched.length) {
        const names = unmatched.map((u) => u.name).join(', ');
        msg += `\n\n⚠️ On n'a pas ${unmatched.length > 1 ? 'ces suppléments' : 'ce supplément'} au Québec : ${names}. Tu peux par contre ${unmatched.length > 1 ? 'les' : 'le'} trouver au Marché Tau ou chez Avril.`;
      }
      if (productMarkers) {
        msg += `\n\nVeux-tu que je mette le tout dans ton panier ?`;
      }
      pushAssistant(msg);
    } catch (err) {
      console.error('[Chatbot] fetchClientPlan error:', err);
      pushAssistant(
        `Désolé, je n'arrive pas à récupérer ton plan pour le moment. Je peux quand même te conseiller selon ton objectif ! ${GUEST_FALLBACK_CHOICES}`
      );
    } finally {
      setClientLogin('idle');
      setLoading(false);
    }
  }

  // Lancé quand la personne dit « Oui, je suis déjà client »
  async function startClientFlow(userText: string) {
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email;
    if (email) {
      pushAssistant('Super ! 🙌 Laisse-moi récupérer ton plan de suppléments…');
      await fetchClientPlan(email);
    } else {
      pushAssistant(
        'Parfait ! Connecte-toi avec le courriel et le mot de passe de ton application NEO Performance — je récupère ensuite ton plan personnalisé. 👇'
      );
      setLoginError(null);
      setClientLogin('form');
    }
  }

  // Soumission du mini-formulaire de connexion dans le chat
  async function submitClientLogin(e: React.FormEvent) {
    e.preventDefault();
    if (clientLogin === 'authing') return;
    setLoginError(null);
    if (!loginFields.email.trim() || !loginFields.password) {
      setLoginError('Entre ton courriel et ton mot de passe.');
      return;
    }
    setClientLogin('authing');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginFields.email.trim(),
      password: loginFields.password,
    });
    if (error) {
      setLoginError('Courriel ou mot de passe incorrect.');
      setClientLogin('form');
      return;
    }
    const email = loginFields.email.trim();
    setClientLogin('idle');
    setLoginFields({ email: '', password: '' });
    pushAssistant('Connexion réussie ✅ Je récupère ton plan de suppléments…');
    await fetchClientPlan(email);
  }

  async function sendMessage(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    // En mode conseil, « Oui je suis client » déclenche le flux Supabase, pas Gemini
    if (mode === 'advisor' && userText === CLIENT_YES) {
      await startClientFlow(userText);
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode,
          // En mode conseil, le serveur assemble le prompt avec le catalogue réel
          catalog: mode === 'advisor'
            ? catalog.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                description: p.description,
              }))
            : undefined,
          userMessage: userText,
        }),
      });
      if (!res.ok) throw new Error(`chat: ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
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

  function handleAddProduct(product: GHLProduct) {
    addItem(product);
    setAddedIds((prev) => new Set(prev).add(product.id));
  }

  function handleAddAll(prods: GHLProduct[]) {
    prods.forEach((p) => addItem(p));
    setAddedIds((prev) => {
      const next = new Set(prev);
      prods.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function handleHumanFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHumanFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submitHumanForm(e: React.FormEvent) {
    e.preventDefault();
    if (humanForm === 'sending' || !humanConsent) return;
    setHumanForm('sending');

    // On joint l'historique de la conversation pour donner du contexte à l'équipe
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Client' : 'Léo'}: ${m.content}`)
      .join('\n');

    try {
      await fetch(CONTACT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: humanFields.firstName,
          nom: humanFields.lastName,
          courriel: humanFields.email,
          telephone: humanFields.phone,
          sujet: humanFields.subject,
          message: `Demande transmise via le clavardage Léo.\n\nConversation :\n${transcript}`,
          source: 'chatbot-leo',
        }),
      });
    } catch (err) {
      console.error('[Chatbot] Webhook contact error:', err);
    }

    setHumanForm('sent');
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: `Merci ${humanFields.firstName || ''} ! 🙌 Ta demande a bien été transmise à notre équipe. Un humain te recontactera sous peu par courriel ou téléphone.`.replace('  ', ' '),
    }]);
    setHumanFields(EMPTY_HUMAN_FORM);
    setHumanConsent(false);
  }

  // Rendu du texte avec liens cliquables (les marqueurs machine ont déjà été retirés)
  function renderContent(text: string) {
    const parts = text.split(/(\[LIEN_RDV\]|\[LIEN_BOUTIQUE\]|\[LIEN_HUMAIN\]|\[LIEN_QUIZ\])/g);
    return parts.map((part, i) => {
      if (part === '[LIEN_HUMAIN]') {
        return (
          <button
            key={i}
            type="button"
            onClick={() => { setHumanForm('open'); }}
            className="inline-flex items-center gap-1 bg-neo text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neo/90 transition-colors mx-1 align-middle"
          >
            <Mail size={12} /> Envoie-nous un courriel
          </button>
        );
      }
      if (part === '[LIEN_RDV]') {
        return (
          <Link key={i} href="/consultation" onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 bg-neo text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neo/90 transition-colors mx-1">
            Prendre rendez-vous <ArrowRight size={12} />
          </Link>
        );
      }
      if (part === '[LIEN_QUIZ]') {
        return (
          <Link key={i} href="/quiz" onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 bg-neo/10 text-neo text-xs font-bold px-3 py-1.5 rounded-full hover:bg-neo hover:text-white transition-colors mx-1">
            Faire le quiz gratuit <ArrowRight size={12} />
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

  // Carte produit recommandée par Léo, avec bouton « Ajouter au panier »
  function renderProductCard(product: GHLProduct) {
    const added = addedIds.has(product.id);
    return (
      <div key={product.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
          {product.image
            ? <img src={product.image} alt={product.name} className="w-10 h-10 object-contain" loading="lazy" />
            : <ShoppingCart size={18} className="text-gray-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
          <p className="text-xs font-extrabold text-neo">{product.price} $</p>
        </div>
        <button
          type="button"
          onClick={() => handleAddProduct(product)}
          disabled={added}
          className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            added ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-neo'
          }`}
        >
          {added ? <><CheckCircle size={12} /> Ajouté</> : <><ShoppingCart size={12} /> Ajouter</>}
        </button>
      </div>
    );
  }

  // Rendu complet d'un message assistant : texte + cartes produits + choix rapides
  function renderAssistantMessage(content: string, isLast: boolean) {
    const productIds = parseProductIds(content);
    const recommended = productIds
      .map((id) => productById.get(id))
      .filter((p): p is GHLProduct => Boolean(p));
    const choices = isLast ? parseChoices(content) : [];
    const cleanText = stripMachineMarkers(content);

    return (
      <>
        {cleanText && (
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed max-w-[80%] whitespace-pre-line">
            {renderContent(cleanText)}
          </div>
        )}

        {recommended.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 w-full max-w-[88%]">
            {recommended.map(renderProductCard)}
            {recommended.length > 1 && (
              <button
                type="button"
                onClick={() => handleAddAll(recommended)}
                className="w-full justify-center bg-neo text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-neo/90 transition-colors"
              >
                <ShoppingCart size={14} /> Tout ajouter au panier ({recommended.length})
              </button>
            )}
          </div>
        )}

        {choices.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => sendMessage(c)}
                className="text-xs bg-neo/10 text-neo font-medium px-3 py-1.5 rounded-full hover:bg-neo hover:text-white transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  // Mode conseil produits hors page → fenêtre centrée (modal) pour bien voir les produits
  const isAdvisorModal = !embedded && mode === 'advisor';

  const panel = (
    <div className={`bg-white flex flex-col overflow-hidden ${
      embedded
        ? 'rounded-3xl border border-gray-100 shadow-xl h-full w-full'
        : isAdvisorModal
          ? 'rounded-3xl shadow-2xl border border-gray-100 h-full w-full'
          : 'rounded-3xl shadow-2xl border border-gray-100'
    }`} style={embedded || isAdvisorModal ? undefined : { height: '520px' }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-neo to-neo/80 px-5 py-4 flex items-center gap-3 shrink-0">
        {humanForm === 'open' ? (
          <button
            type="button"
            onClick={() => setHumanForm('closed')}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Retour au clavardage"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
            L
          </div>
        )}
        <div>
          <p className="text-white font-bold text-sm">Léo</p>
          <p className="text-white/70 text-xs">
            {humanForm === 'open'
              ? 'Te connecter avec un humain'
              : mode === 'advisor'
                ? 'Conseiller en suppléments'
                : 'Assistant virtuel de NEO Performance'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs">En ligne</span>
          </span>
          {isAdvisorModal && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {humanForm === 'open' || humanForm === 'sending' ? (
        /* Formulaire « parler à un humain » (reste affiché pendant l'envoi) */
        <form onSubmit={submitHumanForm} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            Laisse-nous tes coordonnées et un membre de l'équipe NEO Performance te recontactera rapidement. 💬
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input name="firstName" required value={humanFields.firstName} onChange={handleHumanFieldChange}
              placeholder="Prénom *"
              className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400" />
            <input name="lastName" required value={humanFields.lastName} onChange={handleHumanFieldChange}
              placeholder="Nom *"
              className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400" />
          </div>
          <input name="email" type="email" required value={humanFields.email} onChange={handleHumanFieldChange}
            placeholder="Courriel *"
            className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400" />
          <input name="phone" type="tel" value={humanFields.phone} onChange={handleHumanFieldChange}
            placeholder="Téléphone"
            className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400" />
          <input name="subject" required value={humanFields.subject} onChange={handleHumanFieldChange}
            placeholder="Sujet * (ex. reçu d'assurance, commande…)"
            className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 transition-all placeholder:text-gray-400" />

          <label className="flex items-start gap-2 text-xs text-gray-500 leading-snug cursor-pointer">
            <input type="checkbox" checked={humanConsent} onChange={(e) => setHumanConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-neo rounded border-gray-300 focus:ring-neo shrink-0" />
            <span>J'accepte d'être contacté par l'équipe NEO Performance.</span>
          </label>

          <button
            type="submit"
            disabled={humanForm === 'sending' || !humanConsent}
            className="w-full justify-center mt-1 bg-neo text-white font-bold text-sm px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-neo/90 transition-colors disabled:opacity-40"
          >
            {humanForm === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</> : <><Send size={16} /> Envoyer le message</>}
          </button>
        </form>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-neo text-white">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start w-full">
                    <div className="w-7 h-7 rounded-full bg-neo/10 text-neo flex items-center justify-center text-xs font-black mr-2 mt-1 shrink-0">L</div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      {renderAssistantMessage(msg.content, i === messages.length - 1)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Mini-formulaire de connexion « client NEO » (dans le chat, sans quitter la page) */}
            {(clientLogin === 'form' || clientLogin === 'authing') && (
              <form onSubmit={submitClientLogin} className="ml-9 flex flex-col gap-2 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={loginFields.email}
                    onChange={(e) => setLoginFields((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Ton courriel NEO"
                    className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 placeholder:text-gray-400"
                  />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={loginFields.password}
                    onChange={(e) => setLoginFields((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Mot de passe"
                    className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neo/20 placeholder:text-gray-400"
                  />
                </div>
                {loginError && <p className="text-xs text-red-500">{loginError}</p>}
                <button
                  type="submit"
                  disabled={clientLogin === 'authing'}
                  className="w-full justify-center bg-neo text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-neo/90 transition-colors disabled:opacity-50"
                >
                  {clientLogin === 'authing'
                    ? <><Loader2 size={15} className="animate-spin" /> Connexion…</>
                    : <><LogIn size={15} /> Se connecter</>}
                </button>
                <p className="text-[10px] text-gray-400 text-center">
                  Mêmes identifiants que l'application NEO Performance.
                </p>
              </form>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-neo/10 text-neo flex items-center justify-center text-xs font-black mr-2 mt-1 shrink-0">L</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Questions suggérées (mode support uniquement, au début) */}
          {mode === 'support' && messages.length <= 1 && !loading && (
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
          <div className="px-4 pt-3 pb-2 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'advisor' ? 'Écris ta réponse…' : 'Pose ta question'}
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
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Ce clavardage utilise l'IA et peut faire des erreurs
            </p>
          </div>
        </>
      )}
    </div>
  );

  // Mode intégré : on rend juste le panneau, qui remplit son conteneur
  if (embedded) {
    return panel;
  }

  // On masque la bulle flottante sur la page Contact, où Léo est déjà intégré
  if (pathname === '/contact') {
    return null;
  }

  return (
    <>
      {/* Bouton flottant (masqué pendant le modal conseil et sur la boutique,
          où le bouton « Conseil de Léo » le remplace) */}
      {!isAdvisorModal && pathname !== '/boutique' && (
        <button
          onClick={() => setOpen((v) => !v)}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            open ? 'bg-gray-900 scale-90' : 'bg-neo hover:scale-110'
          }`}
          aria-label="Chat avec Léo"
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
      )}

      {/* Mode conseil produits : fenêtre centrée pour bien voir les produits */}
      {isAdvisorModal ? (
        open && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={() => setOpen(false)} />
            <div
              className="relative z-10 w-full max-w-lg h-[90vh] max-h-[720px] animate-app-open"
              style={{ transformOrigin: 'bottom right' }}
            >
              {panel}
            </div>
          </div>
        )
      ) : (
        /* Mode support : fenêtre flottante en bas à droite */
        <div className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}>
          {panel}
        </div>
      )}
    </>
  );
}
