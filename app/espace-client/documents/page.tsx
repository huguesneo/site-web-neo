import type { Metadata } from 'next';
import AccountDocuments from '@/views/AccountDocuments';

export const metadata: Metadata = {
  title: 'Mes documents',
  description: 'Accédez à vos documents NEO Performance : stratégies alimentaires, programmes d’entraînement, reçus et plus.',
  alternates: {
    canonical: 'https://www.neoperformance.ca/espace-client/documents',
  },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountDocuments />;
}
