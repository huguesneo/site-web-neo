'use client';
import { AlertCircle, Loader2 } from 'lucide-react';

export function Chargement({ texte = 'Chargement des forfaits…' }: { texte?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin text-neo" aria-hidden="true" />
      <span>{texte}</span>
    </div>
  );
}

export function MessageErreur({ message, onReessayer }: { message: string; onReessayer?: () => void }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm leading-relaxed">
        <p>{message}</p>
        {onReessayer && (
          <button type="button" onClick={onReessayer} className="mt-2 font-bold underline underline-offset-2">
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}
