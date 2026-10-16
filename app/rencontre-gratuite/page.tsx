import type { Metadata } from 'next';
import RencontreLanding from '@/components/rencontre/RencontreLanding';
import CarteCalendrierA from '@/components/rencontre/CarteCalendrierA';

// Page de pub Meta (version A : calendrier direct) : hors index et hors sitemap.
export const metadata: Metadata = {
  title: 'Rencontre découverte gratuite',
  description:
    "45 minutes en visio avec un membre de l'équipe NEO pour voir ce qui bloque ta perte de poids. Gratuit et sans engagement.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RencontreLanding version="A" cta="Choisir ma plage" carte={<CarteCalendrierA />} />;
}
