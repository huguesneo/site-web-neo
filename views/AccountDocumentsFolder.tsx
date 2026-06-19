'use client';
import React from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { useClientDocuments, FOLDERS, catOf, type FolderKey } from '../hooks/useClientDocuments';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

interface Props {
  category: FolderKey;
}

const AccountDocumentsFolder: React.FC<Props> = ({ category }) => {
  const { user, checkingSession, loading, error, docs } = useClientDocuments();
  const folder = FOLDERS.find((f) => f.key === category)!;

  if (checkingSession) {
    return (
      <section className="min-h-[60vh] bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-neo" />
      </section>
    );
  }

  // Non connecté : page privée → invite à se connecter.
  if (!user) {
    return (
      <div className="bg-white min-h-[60vh] pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neo/10 text-neo mb-4">
            <FolderOpen size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{folder.label}</h1>
          <p className="text-gray-600 mb-6">
            Connectez-vous à votre espace client pour accéder à vos documents NEO Performance.
          </p>
          <Button to="/espace-client">Se connecter</Button>
        </div>
      </div>
    );
  }

  const items = docs.filter((d) => catOf(d.category) === category);

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/espace-client/documents"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-neo mb-4"
          >
            <ArrowLeft size={16} /> Tous les dossiers
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{folder.label}</h1>
          <p className="mt-2 text-gray-600">{folder.description}</p>
        </div>
      </div>

      <div className="bg-white py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-neo" />
            </div>
          )}

          {!loading && error && (
            <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 rounded-xl p-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                <FolderOpen size={26} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Aucun document</h2>
              <p className="mt-1.5 text-gray-500">Ce dossier est vide pour l'instant.</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((d) => {
                const isPdf = d.file_path.toLowerCase().endsWith('.pdf');
                return (
                  <a
                    key={d.id}
                    href={d.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-lg shadow-gray-200/60 transition hover:shadow-xl hover:-translate-y-0.5 ${
                      d.url ? '' : 'pointer-events-none opacity-50'
                    }`}
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-400">
                      {isPdf || !d.url ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <FileText size={28} className="text-neo" />
                          <span className="text-[11px] font-semibold text-gray-400">PDF</span>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.url} alt={d.label} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2">{d.label}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(d.created_at)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountDocumentsFolder;
