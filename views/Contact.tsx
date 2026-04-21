'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Section from '../components/Section';
import Button from '../components/Button';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('https://hook.us1.make.com/9zzcxgr29wn6l6feb2p6qxjgj6teklxi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: formState.firstName,
          nom: formState.lastName,
          courriel: formState.email,
          telephone: formState.phone,
          sujet: formState.subject,
          message: formState.message,
        }),
      });
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      {/* HEADER SECTION */}
      <div className="bg-gray-900 text-white pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neo/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Nous Joindre</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Une question sur nos services ou besoin d'informations ?<br/>Notre équipe est là pour te répondre.
          </p>
        </div>
      </div>

      <Section className="bg-white relative z-10 -mt-10 pt-0 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="grid lg:grid-cols-2">

              {/* LEFT COLUMN: INFO */}
              <div className="bg-neo/5 p-6 sm:p-10 lg:p-16 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Coordonnées</h2>

                  <div className="space-y-5">
                    <div className="flex items-center gap-4 group">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-neo group-hover:scale-110 transition-transform duration-300">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Téléphone</p>
                        <a href="tel:4504864006" className="text-lg font-bold text-gray-900 hover:text-neo transition-colors">
                          450-486-4006
                        </a>
                        <p className="text-xs text-gray-500 mt-0.5">Lundi au Vendredi, 8h - 20h</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-neo group-hover:scale-110 transition-transform duration-300">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Clinique</p>
                        <a
                          href="https://maps.google.com/?q=7005+Bd+Taschereau+suite+350,+Brossard,+QC+J4Z+1A7"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-bold text-gray-900 hover:text-neo transition-colors block leading-snug"
                        >
                          7005 Bd Taschereau, suite 350<br/>
                          Brossard, QC J4Z 1A7
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-neo group-hover:scale-110 transition-transform duration-300">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Courriel</p>
                        <a href="mailto:info@neoperformance.ca" className="text-base font-bold text-gray-900 hover:text-neo transition-colors break-all">
                          info@neoperformance.ca
                        </a>
                        <p className="text-xs text-gray-500 mt-0.5">Réponse sous 24h ouvrables</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 pt-7 border-t border-neo/10">
                   <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3 text-sm">
                     <Clock size={16} className="text-neo" /> Heures d'ouverture
                   </h3>
                   <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="space-y-1">
                        <p><span className="font-semibold text-gray-900">Lundi au jeudi :</span> 8h - 17h</p>
                        <p><span className="font-semibold text-gray-900">Vendredi :</span> 8h - 12h</p>
                      </div>
                      <div className="space-y-1">
                        <p><span className="font-semibold text-gray-900">Samedi :</span> Fermé</p>
                        <p><span className="font-semibold text-gray-900">Dimanche :</span> Fermé</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT COLUMN: STANDARD FORM */}
              <div className="p-6 sm:p-10 lg:p-12 bg-white h-full border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                
                <div className="w-full mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Envoyez-nous un message</h2>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        Pour toute question, remplis le formulaire ci-dessous.
                        Pour une consultation gratuite, réserve directement <Link href="/consultation" className="text-neo font-bold underline decoration-neo/30 underline-offset-4 hover:text-neo-600">ton rendez-vous ici</Link>.
                    </p>
                </div>

                {isSubmitted ? (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                    <p className="text-gray-600 mb-6">
                      Merci de nous avoir contactés. Notre équipe te répondra dans les plus brefs délais (généralement sous 24h).
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prénom *</label>
                        <input 
                          type="text" 
                          name="firstName"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all"
                          placeholder="Votre prénom"
                          value={formState.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nom *</label>
                        <input 
                          type="text" 
                          name="lastName"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all"
                          placeholder="Votre nom"
                          value={formState.lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Courriel *</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all"
                        placeholder="exemple@email.com"
                        value={formState.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                          <input 
                            type="tel" 
                            name="phone"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all"
                            placeholder="(514) 123-4567"
                            value={formState.phone}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sujet</label>
                          <select 
                            name="subject"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all appearance-none"
                            value={formState.subject}
                            onChange={handleChange}
                          >
                            <option value="">Sélectionner un sujet</option>
                            <option value="info">Information générale</option>
                            <option value="rdv">Problème prise de RDV</option>
                            <option value="presse">Presse / Partenariat</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message *</label>
                      <textarea 
                        name="message"
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-neo focus:ring-2 focus:ring-neo/20 outline-none transition-all resize-none"
                        placeholder="Dis-nous comment on peut t'aider."
                        value={formState.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="consent" 
                        className="w-5 h-5 text-neo rounded border-gray-300 focus:ring-neo"
                      />
                      <label htmlFor="consent" className="text-xs text-gray-500">
                        J'accepte d'être contacté par l'équipe NEO Performance.
                      </label>
                    </div>

                    <Button className="w-full justify-center mt-2 group" disabled={isLoading}>
                      {isLoading ? 'Envoi en cours…' : 'Envoyer le message'}
                      {!isLoading && <Send size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                    </Button>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* MAP SECTION */}
      <section className="h-[400px] w-full bg-gray-200 relative">
         <iframe 
           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2797.977467651876!2d-73.4735390238466!3d45.47030807107386!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc90570f2305555%3A0x123456789abcdef!2s7005%20Bd%20Taschereau%20suite%20350%2C%20Brossard%2C%20QC%20J4Z%201A7!5e0!3m2!1sfr!2sca!4v1709920000000!5m2!1sfr!2sca" 
           width="100%" 
           height="100%" 
           style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }} 
           allowFullScreen 
           loading="lazy" 
           referrerPolicy="no-referrer-when-downgrade"
           title="Carte NEO Performance Brossard"
         ></iframe>
         
         {/* Map Overlay Card */}
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white md:hidden">
            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
               <MapPin size={16} className="text-neo" /> 7005 Bd Taschereau, Brossard
            </span>
         </div>
      </section>
    </>
  );
};

export default Contact;