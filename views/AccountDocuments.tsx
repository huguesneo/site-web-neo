'use client';
import React from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, FolderOpen, ChevronRight, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { useClientDocuments, FOLDERS, catOf } from '../hooks/useClientDocuments';

const AccountDocuments: React.FC = () => {
  const { user, checkingSession, loading, error, docs } = useClientDocuments();

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
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Mes documents</h1>
          <p className="text-gray-600 mb-6">
            Connectez-vous à votre espace client pour accéder à vos documents NEO Performance.
          </p>
          <Button to="/espace-client">Se connecter</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/espace-client"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-neo mb-4"
          >
            <ArrowLeft size={16} /> Retour à l'espace client
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Mes documents</h1>
          <p className="mt-2 text-gray-600">
            Vos documents NEO Performance, classés par dossier.
          </p>
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

          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2">
              {FOLDERS.map((f) => {
                const count = docs.filter((d) => catOf(d.category) === f.key).length;
                const Icon = f.icon;
                return (
                  <Link
                    key={f.key}
                    href={`/espace-client/documents/${f.key}`}
                    className="group flex items-center gap-4 text-left bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 p-5 transition hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span
                      className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                      style={{ backgroundColor: `${f.accent}1f`, color: f.accent }}
                    >
                      <Icon size={22} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-gray-900">{f.label}</span>
                      <span className="block text-sm text-gray-500">
                        {count} document{count !== 1 ? 's' : ''}
                      </span>
                    </span>
                    <ChevronRight
                      size={20}
                      className="text-gray-300 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountDocuments;
