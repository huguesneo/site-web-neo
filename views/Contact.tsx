'use client';
import React from 'react';
import Link from 'next/link';
import Section from '../components/Section';
import Chatbot from '../components/Chatbot';
import { Stagger, StaggerItem } from '../components/Reveal';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact: React.FC = () => {
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

                  <Stagger className="space-y-5">
                    <StaggerItem y={18} className="flex items-center gap-4 group">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-neo group-hover:scale-110 transition-transform duration-300">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Téléphone</p>
                        <a href="tel:4504864006" className="text-lg font-bold text-gray-900 hover:text-neo transition-colors">
                          450-486-4006
                        </a>
                        <p className="text-xs text-gray-500 mt-0.5">Lundi au Vendredi</p>
                      </div>
                    </StaggerItem>

                    <StaggerItem y={18} className="flex items-center gap-4 group">
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
                    </StaggerItem>

                    <StaggerItem y={18} className="flex items-center gap-4 group">
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
                    </StaggerItem>
                  </Stagger>
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

              {/* RIGHT COLUMN: CLAVARDAGE AVEC LÉO */}
              <div className="p-6 sm:p-10 lg:p-12 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">

                <div className="w-full mb-6 shrink-0">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Clavarder avec nous</h2>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        Pour toute question, clavarde avec Léo ci-dessous.
                        Pour une consultation gratuite, réserve directement <Link href="/consultation" className="text-neo font-bold underline decoration-neo/30 underline-offset-4 hover:text-neo-600">ton rendez-vous ici</Link>.
                    </p>
                </div>

                <div className="flex-1 min-h-[600px]">
                  <Chatbot embedded />
                </div>

              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* MAP SECTION */}
      <section className="h-[400px] w-full bg-gray-200 relative">
         <iframe 
           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2797.977467651876!2d-73.465332!3d45.4668426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc90f920a39f785%3A0x2375c7e28359dc7d!2sNEO%20Performance!5e0!3m2!1sfr!2sca!4v1709920000000!5m2!1sfr!2sca"
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
               <MapPin size={16} className="text-neo" /> 7005 Bd Taschereau, Suite 350, Brossard
            </span>
         </div>
      </section>
    </>
  );
};

export default Contact;