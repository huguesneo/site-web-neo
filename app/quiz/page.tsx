import type { Metadata } from 'next';
import QuizPage from '@/views/QuizPage';

export const metadata: Metadata = {
  title: 'Quiz Métabolique Gratuit',
  description: 'Tu fais des efforts et ton corps ne suit pas ? En 3 minutes, découvre ton profil métabolique et pourquoi les diètes, le cardio et les calories n’ont pas réglé le problème.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/quiz',
  },
  openGraph: {
    title: 'Quiz Métabolique Gratuit | NEO Performance',
    description: 'Tu fais des efforts et ton corps ne suit pas ? En 3 minutes, découvre ton profil métabolique et pourquoi les diètes, le cardio et les calories n’ont pas réglé le problème.',
    url: 'https://www.neoperformance.ca/quiz',
    siteName: 'NEO Performance',
    locale: 'fr_CA',
    type: 'website',
  },
};

export default function Page() {
  return <QuizPage />;
}
