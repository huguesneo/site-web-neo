'use client';

/**
 * Hook — charge les documents du client connecté (espace client).
 *
 * Source : table `client_photos` (PDF/images dans le bucket privé `client-albums`),
 * via la RPC sécurisée `get_client_documents()` qui isole les documents par
 * `auth.uid()` ↔ `clients.auth_user_id`. On ne requête JAMAIS `client_photos`
 * directement (sa policy RLS est trop permissive). Une URL signée (1 h) est
 * générée pour chaque fichier.
 *
 * Partagé entre la page « tous les dossiers » et chaque page de dossier dédiée.
 */

import { useEffect, useState, type ComponentType } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  FileText,
  Utensils,
  Dumbbell,
  Receipt,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export interface Doc {
  id: string;
  label: string;
  category: string;
  file_path: string;
  source_plan_id: string | null;
  source_program_id: string | null;
  created_at: string;
  url?: string | null;
}

export type FolderKey = 'alimentaire' | 'entrainement' | 'recu' | 'divers';

// Les 4 dossiers, dans l'ordre, avec icône + couleur d'accent (couleur de marque
// NEO #00BBB1 = classe `neo` du site, pour la stratégie alimentaire).
export const FOLDERS: {
  key: FolderKey;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
}[] = [
  {
    key: 'alimentaire',
    label: 'Stratégie alimentaire',
    description: 'Vos plans alimentaires NEO.',
    icon: Utensils,
    accent: '#00BBB1',
  },
  {
    key: 'entrainement',
    label: "Programme d'entraînement",
    description: 'Vos programmes et entraînements.',
    icon: Dumbbell,
    accent: '#6366F1',
  },
  {
    key: 'recu',
    label: "Reçus d'assurance",
    description: 'Vos reçus pour vos assurances.',
    icon: Receipt,
    accent: '#0EA5A0',
  },
  {
    key: 'divers',
    label: 'Documents divers',
    description: 'Vos autres documents.',
    icon: FileText,
    accent: '#86868B',
  },
];

// Replie toute catégorie inconnue vers « divers ».
export const catOf = (c: string): FolderKey =>
  (['alimentaire', 'entrainement', 'recu'] as const).includes(c as 'alimentaire')
    ? (c as FolderKey)
    : 'divers';

export function useClientDocuments() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setUser(session?.user ?? null);
      setCheckingSession(false);
      if (!session) return;

      setLoading(true);
      try {
        const { data: rows, error: rpcError } = await supabase.rpc('get_client_documents');
        if (!mounted) return;
        if (rpcError) {
          setError("Impossible de récupérer vos documents pour l'instant.");
          return;
        }
        const withUrls = await Promise.all(
          ((rows ?? []) as Doc[]).map(async (d) => {
            const { data: signed } = await supabase.storage
              .from('client-albums')
              .createSignedUrl(d.file_path, 3600);
            return { ...d, url: signed?.signedUrl ?? null };
          }),
        );
        if (mounted) setDocs(withUrls);
      } catch {
        if (mounted) setError('Une erreur est survenue. Réessayez dans un instant.');
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { user, checkingSession, loading, error, docs };
}
