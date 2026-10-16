import type { Metadata } from 'next';
import RencontreB from '@/components/rencontre/RencontreB';

// Page de pub Meta (version B : 4 questions puis calendrier) : hors index et hors sitemap.
export const metadata: Metadata = {
  title: 'Rencontre découverte gratuite',
  description:
    "Réponds à 4 questions, puis choisis ta plage : 45 minutes en visio avec un membre de l'équipe NEO. Gratuit et sans engagement.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RencontreB />;
}
