import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AccountDocumentsFolder from '@/views/AccountDocumentsFolder';
import type { FolderKey } from '@/hooks/useClientDocuments';

const FOLDER_LABELS: Record<FolderKey, string> = {
  alimentaire: 'Stratégie alimentaire',
  entrainement: "Programme d'entraînement",
  recu: "Reçus d'assurance",
  divers: 'Documents divers',
};

const VALID = new Set<string>(Object.keys(FOLDER_LABELS));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorie: string }>;
}): Promise<Metadata> {
  const { categorie } = await params;
  const label = FOLDER_LABELS[categorie as FolderKey] ?? 'Mes documents';
  return {
    title: label,
    description: `Vos documents NEO Performance — ${label}.`,
    alternates: {
      canonical: `https://www.neoperformance.ca/espace-client/documents/${categorie}`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ categorie: string }> }) {
  const { categorie } = await params;
  if (!VALID.has(categorie)) notFound();
  return <AccountDocumentsFolder category={categorie as FolderKey} />;
}
