import type { Metadata } from 'next';
import QuizPage from '@/views/QuizPage';

export const metadata: Metadata = {
  title: 'Quiz Métabolique Gratuit | NEO Performance',
  description: 'Faites le test métabolique gratuit de 2 minutes. Identifiez vos blocages hormonaux, digestifs et liés au cortisol. Obtenez votre profil personnalisé instantanément.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/quiz',
  },
  openGraph: {
    title: 'Quiz Métabolique Gratuit | NEO Performance',
    description: 'Faites le test métabolique gratuit de 2 minutes. Identifiez vos blocages hormonaux, digestifs et liés au cortisol. Obtenez votre profil personnalisé instantanément.',
    url: 'https://www.neoperformance.ca/quiz',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <QuizPage />;
}
