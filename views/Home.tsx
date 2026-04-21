'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Section from '../components/Section';
import Button from '../components/Button';
import Counter from '../components/Counter';
import TeamCard from '../components/TeamCard';
import { IMAGES, STATS, TEAM_MEMBERS, TESTIMONIALS } from '../constants';
import { ArrowRight, CheckCircle2, Star, PlayCircle, Bot, ScanBarcode, Utensils, Smartphone, Users, Lock, Activity } from 'lucide-react';

const Home: React.FC = () => {
  const router = useRouter();

  return (
    <>
      {/* HERO SECTION - HIGH IMPACT */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-20">
        {/* Background Image with Slow Zoom Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={IMAGES.hero} 
            alt="Consultation NEO Performance" 
            className="w-full h-full object-cover animate-scale-slow origin-center"
          />
          {/* Advanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:via-white/70 sm:to-white/10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            {/* Staggered Animation Sequence */}
            
            {/* Badge */}
            <div className="opacity-0 animate-fade-in-up [animation-delay:200ms]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-neo/20 text-neo text-sm font-bold tracking-wide uppercase shadow-sm mb-6 hover:scale-105 transition-transform duration-300 cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neo opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neo"></span>
                </span>
                Optimisation Métabolique
              </div>
            </div>

            {/* Main Title */}
            <h1 className="opacity-0 animate-fade-in-up [animation-delay:400ms] text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 font-sans tracking-tight">
              Ton corps envoie des signaux. <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo to-neo-600">Tu mérites enfin quelqu'un qui les comprend.</span>
            </h1>
            
            {/* Subtitle */}
            <p className="opacity-0 animate-fade-in-up [animation-delay:600ms] text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
              Une approche scientifique et humaine pour débloquer ton métabolisme, retrouver ton énergie et optimiser ta vitalité durablement.
            </p>
            
            {/* CTAs */}
            <div className="opacity-0 animate-fade-in-up [animation-delay:800ms] flex flex-col sm:flex-row gap-4 mb-12">
              <Button to="/consultation" variant="primary" className="shadow-xl shadow-neo/30 hover:shadow-neo/50 scale-100 hover:scale-105 transition-all">
                Consultation gratuite (30 min)
              </Button>
              <Button to="/approche" variant="white" className="border border-gray-100 hover:bg-gray-50 text-gray-700">
                <PlayCircle size={20} className="mr-2 text-neo" />
                Découvrir l'approche
              </Button>
            </div>
            
            {/* Social Proof */}
            <div className="opacity-0 animate-fade-in-up [animation-delay:1000ms] flex items-center gap-4 text-sm font-medium text-gray-500 bg-white/60 backdrop-blur-sm p-4 rounded-2xl w-fit border border-white/50 shadow-sm">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden transition-transform hover:scale-110 hover:z-10">
                     <img src={`https://picsum.photos/seed/${i + 50}/100`} alt="Avatar" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span className="text-gray-900 font-bold">4.9/5</span> <span className="text-gray-500">sur 4000+ avis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR - FULL WIDTH INTEGRATED */}
      <div className="bg-neo text-white py-14 relative z-20 shadow-lg">
         {/* Subtle texture overlay */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>
         
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 text-center divide-x-0 md:divide-x divide-white/20">
               {STATS.map((stat, idx) => (
                 <div key={idx} className="group px-2">
                   <div className="transform transition-transform duration-300 hover:scale-105">
                     <Counter 
                       end={stat.value} 
                       suffix={stat.suffix} 
                       prefix={stat.prefix} 
                       className="text-4xl lg:text-6xl font-bold mb-3 block drop-shadow-sm tracking-tight"
                     />
                     <p className="text-white/90 font-bold tracking-widest text-xs uppercase">{stat.label}</p>
                   </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* QUIZ TEASER SECTION */}
      <Section background="light" id="quiz-teaser">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10 md:gap-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neo/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neo/10 text-neo text-xs font-bold uppercase tracking-wider mb-6">
                    <Activity size={14} /> TON PROFIL MÉTABOLIQUE
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 leading-tight">
                  Ton métabolisme est-il <span className="text-neo">bloqué?</span>
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Fatigue chronique, digestion difficile, stress, plateau... Ton corps t'envoie des signaux. Fais le test métabolique de 2 minutes pour identifier tes blocages hormonaux et digestifs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                   <Button to="/quiz" variant="primary" className="shadow-lg shadow-neo/30">
                     Faire l'analyse maintenant
                     <ArrowRight size={18} className="ml-2" />
                   </Button>
                </div>
            </div>
            
            <div className="w-full md:w-1/3 flex justify-center relative z-10">
                {/* Visual representation of quiz */}
                <Link href="/quiz" className="aspect-square w-full max-w-[280px] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-neo transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center group cursor-pointer hover:bg-neo/5">
                     <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Activity size={32} className="text-neo" />
                     </div>
                     <span className="font-bold text-gray-900 group-hover:text-neo transition-colors">Démarrer le test</span>
                     <span className="text-xs text-gray-500 mt-1">Gratuit • 2 min</span>
                </Link>
            </div>
        </div>
      </Section>

      {/* PROBLEM / SOLUTION SECTION */}
      <Section id="approche" className="bg-white">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group perspective-1000">
             {/* Image with decorative elements */}
             <div className="absolute -top-4 -left-4 w-24 h-24 bg-neo/10 rounded-full blur-xl group-hover:bg-neo/20 transition-all duration-500"></div>
             <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl"></div>
             
             <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative z-10 transform transition-transform duration-700 group-hover:scale-[1.02]">
               <img src={IMAGES.method} alt="Science et suppléments" className="w-full h-full object-cover" loading="lazy" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
             </div>
          </div>
          
          <div>
            <div className="inline-block px-3 py-1 bg-neo/10 text-neo text-xs font-bold uppercase tracking-wider rounded-full mb-4">Notre Philosophie</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Arrête de te battre contre ton corps. Commence à <span className="relative inline-block text-neo">
                le comprendre
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-neo/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Stress, digestion difficile, déséquilibres hormonaux... Ton corps te parle. La plupart des programmes se concentre uniquement à compter les calories, ignorant la complexité de ta biochimie unique.
            </p>
            <div className="space-y-4 mb-10">
              {[
                "Analyse complète de ton profil métabolique",
                "Gestion du cortisol et hormonale",
                "Optimisation digestive et de la flore",
                "Accompagnement humain et ajustements constants"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                  <div className="w-10 h-10 rounded-full bg-neo/10 flex items-center justify-center shrink-0 group-hover:bg-neo group-hover:text-white transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{item}</span>
                </div>
              ))}
            </div>
            <Button to="/approche" variant="outline" className="group">
              Découvre notre méthode 
              <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </Section>

      {/* PROGRAMME STEPS */}
      <Section background="gray" className="text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Le Programme d'Optimisation</h2>
          <p className="text-gray-600 text-lg">Un parcours clair en 4 étapes pour reprendre le contrôle.</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Évaluation", desc: "Tests métaboliques, historique complet et objectifs. Ton naturopathe te connaît avant même de commencer." },
            { step: "02", title: "Ton plan", desc: "Structure alimentaire, suppléments et mode de vie. Tout ciblé sur tes trois piliers : cortisol, digestion, hormones." },
            { step: "03", title: "Accompagnement", desc: "Rencontres aux deux semaines, chat quotidien avec ton naturopathe et accès à Léo, notre IA." },
            { step: "04", title: "Résultats", desc: "Tests à la semaine 1, 6 et 13. À la semaine 15 : un métabolisme optimisé et les outils pour garder tes résultats." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl text-neo select-none group-hover:scale-110 transition-transform">{item.step}</div>
              <div className="w-12 h-12 rounded-xl bg-neo/10 text-neo flex items-center justify-center font-bold text-xl mb-6 group-hover:bg-neo group-hover:text-white transition-colors">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* LÉO AI SECTION */}
      <Section background="dark" className="relative overflow-hidden">
        {/* Background Tech Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neo/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neo/20 text-neo text-xs font-bold uppercase tracking-wider mb-6 border border-neo/20">
              <Bot size={14} />
              Innovation Exclusive
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Rencontre <span className="text-neo">LÉO</span>, ton assistant métabolique 24/7.
            </h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Parce que ton naturopathe ne peut pas être dans ta poche au restaurant ou à l'épicerie. LÉO est une IA développée par NEO pour te guider en temps réel, basée sur ton profil unique.
            </p>

            <div className="space-y-6">
              {[
                { 
                  icon: Utensils, 
                  title: "Générateur de Recettes", 
                  desc: "Crée des recettes délicieuses adaptées à TES objectifs et restrictions." 
                },
                { 
                  icon: Smartphone, 
                  title: "Assistant Restaurant", 
                  desc: "Dis-lui où tu manges ! LÉO analyse le menu pour toi et te suggère le meilleur choix pour ton métabolisme." 
                },
                { 
                  icon: ScanBarcode, 
                  title: "Scan Alimentaire", 
                  desc: "Scanne un produit et reçois une analyse instantanée : LÉO t'explique s'il est réellement bénéfique pour toi." 
                }
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-neo to-neo-700 flex items-center justify-center text-white shadow-lg shadow-neo/20">
                    <feature.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Phone Mockup Representation */}
            <div className="relative w-72 md:w-80 aspect-[9/19] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="absolute top-0 inset-x-0 h-8 bg-gray-800 rounded-b-xl z-20"></div>
               
               {/* Screen Content */}
               <div className="w-full h-full bg-gray-900 flex flex-col p-6 pt-12 relative">
                 {/* Chat UI Bubble */}
                 <div className="mt-auto space-y-4">
                   <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] border border-gray-700">
                     <p className="text-xs text-gray-400 mb-1">Vous</p>
                     <p className="text-sm text-white">Je suis au restaurant "Le Local", je prends quoi ?</p>
                   </div>
                   
                   <div className="bg-neo/20 p-3 rounded-2xl rounded-tr-none max-w-[90%] ml-auto border border-neo/30 relative">
                     <div className="absolute -top-6 right-0 flex items-center gap-1">
                        <span className="text-xs font-bold text-neo">LÉO</span>
                        <div className="w-2 h-2 rounded-full bg-neo animate-pulse"></div>
                     </div>
                     <p className="text-sm text-white">
                       D'après ton profil et ton objectif d'énergie, je te recommande le <strong className="text-neo">Tartare de Saumon</strong> (sans croûtons) ou la <strong className="text-neo">Salade de Canard</strong>. Évite les frites ce midi pour ta digestion.
                     </p>
                   </div>

                   <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Vous</p>
                      <p className="text-sm text-white">Merci Léo ! 👍</p>
                   </div>
                 </div>
               </div>
               
               {/* Glow effect behind phone */}
               <div className="absolute inset-0 bg-gradient-to-t from-neo/20 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-1/4 -right-8 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 animate-float text-white text-xs font-bold shadow-xl">
               ✅ Approuvé par votre expert
            </div>
            <div className="absolute bottom-1/4 -left-8 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 animate-float [animation-delay:1000ms] text-white text-xs font-bold shadow-xl flex items-center gap-2">
               <ScanBarcode size={16} className="text-neo" /> Score: Excellent
            </div>
          </div>
        </div>
      </Section>

      {/* TEAM PREVIEW */}
      <Section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <span className="text-neo font-bold uppercase tracking-wider text-sm mb-2 block">Nos Experts</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">L'Équipe NEO</h2>
            <p className="text-gray-600 max-w-xl text-lg">Des experts passionnés par la santé intégrative, unis pour votre réussite.</p>
          </div>
          <Link href="/equipe" className="group flex items-center text-neo font-bold hover:text-neo-700 transition-colors bg-neo/5 px-6 py-3 rounded-full">
            Voir toute l'équipe <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM_MEMBERS.slice(0, 4).map((member, idx) => (
            <div key={member.id} className={`opacity-0 animate-fade-in-up [animation-delay:${idx * 100}ms] fill-mode-forwards`}>
              <TeamCard 
                member={member} 
                onClick={() => router.push('/equipe')} 
              />
            </div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section background="light">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Histoires de succès</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div key={t.id} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative group border border-transparent hover:border-neo/20">
              <div className="absolute -top-4 -left-2 text-6xl text-neo/20 font-serif leading-none">"</div>
              <div className="flex text-yellow-400 mb-6">
                {[...Array(t.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" className="mr-1" />)}
              </div>
              <p className="text-gray-700 italic mb-8 leading-relaxed relative z-10">{t.text}</p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="font-bold text-gray-900 group-hover:text-neo transition-colors">{t.name}</span>
                <span className="text-xs font-bold text-neo bg-neo/10 px-3 py-1 rounded-full">{t.result}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      
      {/* FACEBOOK COMMUNITY SECTION - PREMIUM & CLEAN */}
      <Section background="white">
        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
             <div className="p-12 md:p-16 flex flex-col justify-center bg-gray-900 text-white">
                <div className="inline-flex items-center gap-2 text-neo font-bold uppercase tracking-widest text-sm mb-6">
                  <Lock size={16} /> Cercle Privé
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">La Communauté NEO</h2>
                <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                   Tu n'es plus seule dans ton parcours. Rejoins notre groupe exclusif pour échanger, recevoir ton boost de conseils quotidiens et partager tes victoires avec des milliers de gens motivés comme toi
                </p>
                <a 
                  href="https://www.facebook.com/groups/perdredupoidsmethodeneo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-neo hover:text-white font-bold py-4 px-8 rounded-full transition-all duration-300 w-fit group"
                >
                  <Users size={20} />
                  Demander l'accès au groupe
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
             </div>
             <div className="relative min-h-[400px]">
                <img 
                   src="https://assets.cdn.filesafe.space/YG2spvWJqnD75L3V95UJ/media/69e637329f80f3338698f1b0.png" 
                   alt="Communauté de femmes"
                   className="absolute inset-0 w-full h-full object-cover"
                   loading="lazy"
                />
                <div className="absolute inset-0 bg-neo/10 mix-blend-multiply"></div>
             </div>
          </div>
        </div>
      </Section>

      {/* FINAL CTA - Modern Dark */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img src={IMAGES.clinic} className="w-full h-full object-cover opacity-10 grayscale mix-blend-overlay" alt="Clinic background" loading="lazy" />
        </div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-neo rounded-full opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-[100px]"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Prêt à reprendre le contrôle ?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Réserve ta consultation gratuite et découvre exactement ce qui t'empêche d'avancer.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
             <Button to="/consultation" variant="primary" className="text-lg px-12 py-5 shadow-2xl shadow-neo/40 hover:scale-105 transition-transform">
               Réserver ma consultation gratuite
             </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-neo" /> Aucun engagement requis. 30 minutes offertes.
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;