'use client';
import React, { useEffect } from 'react';
import Section from '../components/Section';
import { BOOKING_IFRAME_SRC } from '../constants';
import { Video, ShieldCheck, Clock } from 'lucide-react';

const Consultation: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <>
      <div className="bg-neo/10 pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Consultation Gratuite</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Réserve ton appel de 30 minutes avec un expert NEO. On prend le temps de comprendre ta situation et de voir si on est le bon fit pour toi.
          </p>
        </div>
      </div>

      <Section className="py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Info Side */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="text-neo" /> Déroulement
              </h3>
              <p className="text-gray-600">
                La consultation se fait 100% en ligne via Google Meet. On analyse ton historique, tes objectifs et ce qui bloque ton métabolisme en ce moment.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Video className="text-neo" /> À quoi s'attendre
              </h3>
              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                <li>Écoute active de ta situation</li>
                <li>Identification de ce qui bloque ton métabolisme</li>
                <li>Présentation de notre approche</li>
                <li>On te dit honnêtement si on peut t'aider</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-neo" /> Assurances
              </h3>
              <p className="text-gray-600">
                Nos services sont couverts par la plupart des assurances privées (Naturopathie / Naturothérapie).
              </p>
            </div>
          </div>

          {/* Calendar Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <iframe 
              src={BOOKING_IFRAME_SRC} 
              // J'ai remplacé le style en ligne par des classes Tailwind réactives
              className="w-full border-none h-[500px] md:h-[600px] lg:h-[700px]"
              scrolling="auto" 
              id="booking-widget"
              title="Calendrier de réservation"
            ></iframe>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Consultation;