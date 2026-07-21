'use client';

import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import { Reveal, Stagger, StaggerItem } from '@/components/Reveal';
import { GOOGLE_LISTING_URL } from '@/views/pitch-content';

/**
 * Page publique « Résultats clients » (/temoignages).
 *
 * Reprend la page témoignages d'origine (GoHighLevel) — mêmes vidéos et mêmes
 * photos avant/après hébergées chez GHL — mais redessinée aux couleurs et aux
 * conventions du site (Montserrat, teal NEO, cartes `rounded-2xl`, révélations
 * au scroll via <Reveal>/<Stagger>). Le cadrage privé « document confidentiel /
 * rencontre confirmée » (la page servait de suivi post-réservation) a été retiré
 * au profit d'un vrai appel à l'action : elle est maintenant montrée à froid
 * depuis Instagram (/lien) et indexée pour le SEO.
 */

const BASE = 'https://storage.googleapis.com/msgsndr/YG2spvWJqnD75L3V95UJ/media';

type VideoTestimonial = {
  src: string;
  result: string;
  name: string;
  detail: string;
};

const VIDEOS: VideoTestimonial[] = [
  { src: `${BASE}/698b388d67d74988b64bd46d.mp4`, result: '-20 lbs de gras', name: 'Maryse', detail: 'Dort enfin, stress bas, énergie retrouvée' },
  { src: `${BASE}/698b387fa41b8756c34ab905.mp4`, result: '-10 % de gras', name: 'Véronique', detail: 'Hormones gérées, plateau brisé' },
  { src: `${BASE}/698b4cc4a41b873522510eae.mp4`, result: '-13 lbs', name: 'Charlie', detail: 'Digestion optimisée, plateau brisé' },
  { src: `${BASE}/698b4ba6a41b87af3150b857.mp4`, result: 'Digestion ✓', name: 'Minouche', detail: 'Comprend enfin son corps' },
  { src: `${BASE}/698b3891868215cd8651a438.mp4`, result: 'Vie transformée', name: 'Nadia', detail: 'Comment NEO a changé sa vie' },
  { src: `${BASE}/698b384b52c9527bcdad09f8.mp4`, result: 'Métabolisme max', name: 'Nadia — Santé', detail: 'Stress en chute libre' },
  { src: `${BASE}/698b4a6952c9523dd2b30213.mp4`, result: 'Plateau de 4 ans ✓', name: 'Andréanne', detail: 'Enfin brisé après 4 ans' },
  { src: `${BASE}/698b388467d749190c4bd16c.mp4`, result: '-24 lbs adipeux', name: 'Alexandre', detail: 'Plateau brisé, composition changée' },
  { src: `${BASE}/698b38658682157e95519498.mp4`, result: 'Métabolisme réparé', name: 'Samuel', detail: 'Problème métabolique réglé' },
  { src: `${BASE}/698b38897f6dcf3ffcbf07d6.mp4`, result: 'Succès en couple', name: 'En couple', detail: 'Malgré un horaire atypique' },
];

const BEFORE_AFTER: string[] = [
  `${BASE}/698b69e967d7494c815baf8d.png`,
  `${BASE}/698b6b2167d74944aa5c029d.png`,
  `${BASE}/698b68f91fe16693a25c84ea.png`,
  `${BASE}/698b694f52c9522a67bcf550.png`,
];

function ResultPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-gradient-to-br from-neo to-neo-700 text-white text-[11px] font-extrabold tracking-wide px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}

export default function Temoignages() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Tache teal discrète, comme sur la page d'accueil */}
        <div
          aria-hidden="true"
          className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-neo/5 blur-3xl"
        />
        <div className="relative max-w-2xl mx-auto px-4 pt-16 md:pt-24 pb-12 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neo/10 text-neo text-xs font-bold uppercase tracking-wider mb-6">
              <span className="flex text-neo">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </span>
              Résultats réels
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-4">
              Ils étaient là où tu es.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo to-neo-600">
                Voici ce qui s&apos;est passé ensuite.
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Des résultats réels, documentés, dans leurs propres mots. Pas triés sur le volet.
            </p>
          </Reveal>
        </div>
      </section>

      {/* TÉMOIGNAGES VIDÉO */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-8 md:mb-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-neo mb-2">
              Dans leurs mots
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Témoignages vidéo
            </h2>
          </Reveal>

          <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" gap={0.08}>
            {VIDEOS.map((v) => (
              <StaggerItem
                key={v.src}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="relative aspect-video bg-black">
                  <video
                    preload="metadata"
                    controls
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                  >
                    <source src={v.src} type="video/mp4" />
                  </video>
                </div>
                <div className="p-3">
                  <ResultPill>{v.result}</ResultPill>
                  <p className="mt-2 text-xs font-bold text-gray-800">{v.name}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{v.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* AVANT / APRÈS */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-neo mb-2">
              Preuves visuelles
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
              Des transformations réelles
            </h2>
            <p className="text-gray-500 mt-2">
              Pas des photos retouchées — des résultats mesurés.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-2 gap-3 md:gap-4" gap={0.1}>
            {BEFORE_AFTER.map((src, i) => (
              <StaggerItem
                key={src}
                className="rounded-2xl overflow-hidden shadow-md border-4 border-white ring-1 ring-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Transformation client NEO Performance ${i + 1}`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="text-center mt-8" delay={0.1}>
            <a
              href={GOOGLE_LISTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-neo-700 transition-colors"
            >
              <span className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </span>
              4,9/5 · 4000+ avis Google →
            </a>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <Reveal className="bg-neo/5 border border-neo/20 rounded-3xl p-8 md:p-12 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-neo mb-3">
              Et toi maintenant ?
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
              On a hâte de parler de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo to-neo-600">
                ton dossier
              </span>
              .
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-8">
              Ce que tu viens de voir, c&apos;est exactement le type de travail personnalisé qu&apos;on
              fait pour chaque client. Lors de ta consultation gratuite, on analyse{' '}
              <strong className="text-gray-800">ta</strong> situation,{' '}
              <strong className="text-gray-800">tes</strong> blocages et{' '}
              <strong className="text-gray-800">ton</strong> point de départ — sans jugement.
            </p>
            <Button to="/consultation" variant="primary" className="shadow-xl shadow-neo/30">
              Réserve ta consultation gratuite (45 min)
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
