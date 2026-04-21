'use client';
import React, { useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { IMAGES } from '../constants';
import {
  Brain,
  Activity,
  Utensils,
  Bot,
  Smartphone,
  HeartHandshake,
  CalendarDays,
  FlaskConical,
  ShieldCheck,
  MapPin,
  ScanBarcode,
  Zap,
  X,
  Loader2
} from 'lucide-react';

const WEBHOOK_URL = 'https://hook.us1.make.com/usi4258tpihvrwj2m6vj5e761n763x0u';
const REDIRECT_URL = 'https://go.neoperformance.ca/perte-de-poids';

const LeadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        firstName: form.prenom,
        lastName: form.nom,
        email: form.email,
        phone: form.telephone,
      });
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        mode: 'no-cors',
      });
      window.location.href = REDIRECT_URL;
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <X size={22} />
        </button>

        <div className="text-center mb-6">
          <span className="text-neo font-bold tracking-wider uppercase text-xs">Atelier gratuit</span>
          <h3 className="text-2xl font-black text-gray-900 mt-2 leading-tight">
            Débloquez votre métabolisme
          </h3>
          <p className="text-gray-500 text-sm mt-2">
            Accès immédiat. Aucune carte de crédit requise.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                placeholder="Jean"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neo/50 focus:border-neo text-gray-900 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de famille</label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                placeholder="Tremblay"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neo/50 focus:border-neo text-gray-900 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="jean@exemple.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neo/50 focus:border-neo text-gray-900 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              required
              placeholder="514 000-0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neo/50 focus:border-neo text-gray-900 transition"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neo hover:bg-neo-600 text-white font-bold py-4 rounded-full text-base shadow-lg hover:shadow-neo/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'Envoi en cours…' : 'Débloquer mon métabolisme'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Vos informations sont confidentielles et ne seront jamais partagées.
        </p>
      </div>
    </div>
  );
};

const Approach: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* 1. HERO SECTION : Inclusif (Métabolisme, Énergie, Stress, Perte de gras) */}
      <div className="pt-32 pb-20 bg-gray-900 text-white text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full bg-neo/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <span className="text-neo font-bold tracking-wider uppercase text-sm mb-4 block">
            La science au service de votre corps
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Reprogramme ton métabolisme. Retrouve ta vitalité.
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Fatigue chronique, stress, digestion difficile, poids qui stagne... La plupart des approches gèrent ce que tu ressens. Chez NEO, on remonte à la source : cortisol, digestion, hormones. On ne travaille pas sur les signaux. On corrige ce qui les crée.
          </p>
        </div>
      </div>

      {/* 2. PHILOSOPHIE : Empathie et Expertise */}
      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
           <div>
             <div className="flex items-center gap-3 mb-4 text-neo">
               <HeartHandshake size={28} />
               <h2 className="text-2xl font-bold text-gray-900">Nous comprenons ta réalité</h2>
             </div>
             <h3 className="text-3xl font-bold mb-6 text-gray-900">Ton corps ne travaille pas contre toi. Il compense.</h3>
             <p className="text-gray-600 text-lg mb-6">
               Tu as l'impression d'avoir tout essayé sans résultats durables ? C'est rarement un manque d'effort. Les approches restrictives "mange moins, bouge plus" mettent le corps sous pression et bloquent le métabolisme au lieu de le libérer.
             </p>
             <p className="text-gray-600 text-lg">
               Chez NEO Performance, on utilise une approche basée sur des tests précis pour identifier ce qui bloque ton métabolisme. On crée ensuite un plan d'action personnalisé qui nourrit ton corps au lieu de le priver. C'est la clé pour débloquer une perte de poids durable, plus d'énergie et une santé métabolique optimale.
             </p>
           </div>
           <div className="rounded-3xl overflow-hidden shadow-2xl relative">
             <img src={IMAGES.Lyliane} alt="Approche clinique NEO Performance" className="w-full object-cover" loading="lazy" />
           </div>
        </div>
      </Section>

      {/* SECTION ATELIER GRATUIT */}
      <Section background="dark" className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-neo/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="text-neo font-bold tracking-widest uppercase text-sm">
              Comprendre pour transformer
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Découvre pourquoi ton métabolisme est lent
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Ton métabolisme n'est pas «&nbsp;brisé&nbsp;», il est juste «&nbsp;verrouillé&nbsp;» par le stress et les variations hormonales. Découvre la méthode scientifique pour réactiver tes fonctions métaboliques naturelles, sans régime restrictif.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setShowModal(true)}
                className="text-lg px-10 py-5 shadow-[0_0_40px_-10px_rgba(0,187,177,0.4)] hover:shadow-[0_0_60px_-15px_rgba(0,187,177,0.6)] transition-all"
              >
                Obtenir l'atelier gratuit
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {showModal && <LeadModal onClose={() => setShowModal(false)} />}

      {/* ... (La suite avec les 3 Piliers, etc.) ... */}

      {/* 3. LES 3 PILIERS */}
      <Section background="light">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">L'Écosystème Métabolique NEO</h2>
          <p className="text-gray-600 text-lg">Notre méthode repose sur trois piliers interdépendants. Si un est déréglé, tout le reste compensse.</p>
        </div>
        
        
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {[
            { 
              icon: Utensils, 
              title: "1. Optimisation Digestive", 
              desc: "Un système digestif optimal, c'est la base de tout. On évalue ton acidité et ton temps de transit pour que ton corps assimile correctement ce que tu lui donnes et réduise l'inflammation de l'intérieur." 
            },
            { 
              icon: Brain, 
              title: "2. Gestion du Cortisol", 
              desc: "Le stress chronique maintient ton corps en mode survie et bloque le déstockage des graisses. On travaille les trois sources de stress : physique, chimique et psychologique, pour libérer ton métabolisme." 
            },
            { 
              icon: Activity, 
              title: "3. Équilibre Hormonal", 
              desc: "Tes hormones régulent ta faim, ton énergie et ta composition corporelle. Un déséquilibre hormonal crée une résistance que l'effort seul ne peut pas surmonter. On les optimise naturellement pour que ton corps réponde enfin." 
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center border-t-4 border-transparent hover:border-neo">
              <div className="w-16 h-16 bg-neo/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-neo">
                <item.icon size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. LE PROGRAMME DE 15 SEMAINES */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Le Programme d'Optimisation de 15 Semaines</h2>
            <p className="text-gray-600 text-lg">Un parcours structuré sur 15 semaines pour des résultats mesurables et durables.</p>
          </div>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            {/* Semaine 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-gray-900 text-white font-bold text-xl shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                S1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <FlaskConical size={20} className="text-neo" /> L'Évaluation initiale
                </h4>
                <p className="text-gray-600">
                  Rencontre de 60 à 75 minutes pour établir ton profil métabolique complet. On ne devine rien, on teste : test de stress sur 180 points, test d'acidité et test de transit pour partir sur des bases concrètes.
                </p>
              </div>
            </div>

            {/* Le Reset */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-neo text-white font-bold text-xl shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                14J
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-neo/5 border border-neo/20 shadow-sm">
                <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Zap size={20} className="text-neo" /> Le Reset Métabolique
                </h4>
                <p className="text-gray-600">
                  Une structure alimentaire de 14 jours conçue pour abaisser l'inflammation et le stress oxydatif. C'est ici que l'énergie revient et que le corps commence à désétocker.
                </p>
              </div>
            </div>

            {/* Le Suivi */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-white bg-white text-gray-900 border-gray-200 font-bold text-xl shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                S2+
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <CalendarDays size={20} className="text-neo" /> Suivi & Ajustements
                </h4>
                <p className="text-gray-600">
                  Rencontres aux deux semaines avec ton naturopathe. Tests métaboliques aux semaines 6 et 13 pour mesurer ta progression. Chat quotidien et accès à ta formation en ligne sur le métabolisme.
                </p>
              </div>
            </div>

          </div>
        </div>
      </Section>

      {/* 5. IA LÉO : L'avantage technologique (Design inspiré de votre Home Page) */}
      <Section background="dark" className="relative overflow-hidden py-24">
        {/* Background Tech Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neo/10 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Texte et Features */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neo/10 text-neo text-sm font-bold uppercase tracking-wider mb-6 border border-neo/20">
                <Bot size={16} />
                Exclusivité Technologique
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white">
              Ton plan personnalisé.<br/>Soutenu par <span className="text-neo">LÉO</span>.
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Ton naturopathe établit la stratégie, LÉO s'occupe de l'exécution. Notre IA exclusive, utilisée plus de 1 000 fois par jour, analyse ton profil et te guide en temps réel pour faire les bons choix, sans charge mentale.
              </p>

              <div className="space-y-5">
                {[
                  { 
                    icon: Utensils, 
                    title: "Générateur de Recettes & Épicerie", 
                    desc: "Des recettes adaptées à tes intolérances, ta liste d'épicerie générée automatiquement et les rabais en circulaire trouvés pour toi." 
                  },
                  { 
                    icon: Smartphone, 
                    title: "Assistant Restaurant", 
                    desc: "Tu sors ce soir ? LÉO analyse le menu du restaurant et te recommande le meilleur choix pour ton métabolisme." 
                  },
                  { 
                    icon: ScanBarcode, 
                    title: "Scan Alimentaire Personnalisé", 
                    desc: "Scanne un produit : LÉO ne te donne pas une note générique. Il te dit si c'est bon pour TON métabolisme, selon ton plan spécifique." 
                  }
                ].map((feature, idx) => (
                  <div key={idx} className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                    <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-neo to-neo/60 flex items-center justify-center text-white shadow-lg shadow-neo/20">
                      <feature.icon size={26} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualisation : Mockup Téléphone avec Chat ancré dans la méthode */}
            <div className="relative flex justify-center mt-12 lg:mt-0">
              <div className="relative w-[280px] md:w-[320px] aspect-[9/19] bg-gray-900 rounded-[3rem] border-[10px] border-gray-800 shadow-2xl shadow-neo/20 overflow-hidden transform md:rotate-3 md:hover:rotate-0 transition-transform duration-700">
                 {/* Notch du téléphone */}
                 <div className="absolute top-0 inset-x-0 h-7 bg-gray-800 rounded-b-2xl z-20 w-1/2 mx-auto"></div>
                 
                 {/* Contenu de l'écran */}
                 <div className="w-full h-full bg-[#0B1121] flex flex-col p-5 pt-14 relative z-10">
                   
                   {/* En-tête chat */}
                   <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
                     <div className="w-10 h-10 rounded-full bg-neo flex items-center justify-center">
                       <Bot size={20} className="text-white" />
                     </div>
                     <div>
                       <h5 className="text-white font-bold text-sm">LÉO Assistant</h5>
                       <p className="text-neo text-xs flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-neo animate-pulse"></span> En ligne
                       </p>
                     </div>
                   </div>

                   {/* Bulles de Chat */}
                   <div className="mt-auto space-y-5">
                     <div className="bg-gray-800/80 p-3.5 rounded-2xl rounded-tl-sm max-w-[85%] border border-gray-700 backdrop-blur-md">
                       <p className="text-xs text-gray-400 mb-1">Vous</p>
                       <p className="text-sm text-white">J'ai eu une grosse journée de stress au travail, je suis épuisée. Qu'est-ce que je mange ce soir ?</p>
                     </div>
                     
                     <div className="bg-neo/15 p-3.5 rounded-2xl rounded-tr-sm max-w-[90%] ml-auto border border-neo/30 relative backdrop-blur-md">
                       <div className="absolute -top-3 -right-2 bg-neo p-1.5 rounded-full shadow-lg">
                          <Brain size={12} className="text-gray-900" />
                       </div>
                       <p className="text-sm text-white leading-relaxed">
                         Je vois ça ! Ton plan vise justement à <strong className="text-neo">gérer ton cortisol</strong>. Pour calmer ton système nerveux, je te suggère un repas riche en magnésium et oméga-3. <br/><br/>
                         Voici 2 idées rapides avec ce qu'il te reste au frigo :<br/>
                         🐟 Pavé de saumon et asperges<br/>
                         🥗 Salade tiède de lentilles
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Effet de reflet sur l'écran */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>
              </div>
              
              {/* Badges Flottants (Réassurance) */}
              <div className="absolute top-1/4 -right-4 md:-right-12 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 animate-[float_6s_ease-in-out_infinite] text-white text-sm font-bold shadow-xl flex items-center gap-2 z-30">
                 <ShieldCheck size={18} className="text-neo" /> Conforme à votre plan
              </div>
              <div className="absolute bottom-1/4 -left-4 md:-left-12 bg-gray-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-700 animate-[float_8s_ease-in-out_infinite_reverse] text-white text-sm font-bold shadow-xl flex items-center gap-2 z-30">
                 <Utensils size={18} className="text-neo" /> 1000+ recettes adaptées
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. RÉASSURANCE & FAQ */}
      <Section>
        <div className="max-w-4xl mx-auto">
           {/* Badges de réassurance */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <div className="flex items-center gap-5 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 transition-transform hover:-translate-y-1">
                <ShieldCheck className="text-blue-600 shrink-0" size={36} />
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Services couverts</h4>
                  <p className="text-gray-600">Remise de 15 reçus d'assurance en naturopathie.</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-green-50/50 p-5 rounded-2xl border border-green-100 transition-transform hover:-translate-y-1">
                <MapPin className="text-green-600 shrink-0" size={36} />
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Clinique ou Visio</h4>
                  <p className="text-gray-600">Rencontre-nous à notre clinique de Brossard ou en visioconférence, selon ce qui te convient.</p>
                </div>
              </div>
           </div>

           <div className="text-center mb-10">
             <h2 className="text-3xl font-bold text-gray-900">Questions Fréquentes</h2>
           </div>
           
           <div className="space-y-4">
             {[
               { q: "Est-ce seulement pour perdre du poids ?", a: "Non. Notre priorité c'est ton métabolisme. Fatigue, inconforts digestifs, stress chronique, déséquilibres hormonaux : le programme est conçu pour tout ça. La perte de gras est souvent la conséquence naturelle d'un corps qui fonctionne enfin bien." },
               { q: "Est-ce une énième diète restrictive ?", a: "C'est l'exact opposé. La privation ralentit le métabolisme et met le corps sous pression. On travaille avec des structures alimentaires qui nourrissent ton corps au lieu de le priver." },
               { q: "Est-ce que LÉO remplace mon naturopathe ?", a: "Absolument pas. Ton naturopathe conçoit ta stratégie de A à Z et effectue tous les suivis. LÉO est ton outil quotidien pour appliquer ton plan sans te casser la tête." }
             ].map((faq, idx) => (
               <div key={idx} className="border border-gray-200 bg-white rounded-2xl p-6 hover:border-neo/50 transition-colors shadow-sm">
                 <h4 className="font-bold text-lg mb-3 text-gray-900">{faq.q}</h4>
                 <p className="text-gray-600 leading-relaxed">{faq.a}</p>
               </div>
             ))}
           </div>
           
           <div className="mt-14 text-center">
             <Button to="/consultation" className="text-lg px-8 py-4 shadow-xl hover:shadow-neo/30 hover:-translate-y-0.5 transition-all">
               Réserver ma consultation gratuite
             </Button>
             <p className="text-sm text-gray-500 mt-4">Places limitées chaque mois pour garantir la qualité de l'accompagnement.</p>
           </div>
        </div>
      </Section>
    </>
  );
};

export default Approach;