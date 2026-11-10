/**
 * Blocs visuels du quiz oméga-3.
 *
 * COPIE volontaire des blocs de components/Quiz.tsx (/quiz), pour avoir
 * exactement le même look sans toucher au quiz métabolique. Un refactor
 * partagé (un seul fichier pour les deux quiz) se fera dans une PR séparée.
 */
import React from 'react';

export const Wrap = ({ wide, children, animKey }: { wide?: boolean; children: React.ReactNode; animKey?: number }) => (
  <div key={animKey} className={`mx-auto px-4 animate-fade-in-up ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
    {children}
  </div>
);

export const Q = ({ title, sub }: { title: string; sub?: string }) => (
  <>
    <h2 className={`text-2xl md:text-3xl font-extrabold text-gray-900 text-center ${sub ? 'mb-2' : 'mb-8'}`}>{title}</h2>
    {sub && <p className="text-gray-500 text-center font-medium mb-8">{sub}</p>}
  </>
);

export const Opt = ({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-6 py-5 rounded-2xl border-2 border-gray-100 bg-white
               hover:border-neo hover:bg-neo/5 hover:shadow-lg transition-all duration-200
               font-semibold text-gray-800 hover:text-neo group flex items-center justify-between mb-3"
  >
    <span className="flex-1 leading-snug">
      {label}
      {sub && <span className="block text-sm text-gray-400 font-medium mt-0.5">{sub}</span>}
    </span>
    <span className="text-gray-300 group-hover:text-neo transition-colors ml-4 text-xl flex-shrink-0">→</span>
  </button>
);

export const CTA = ({ label, onClick, type = 'button', disabled, sub }: {
  label: string; onClick?: () => void; type?: 'button' | 'submit';
  disabled?: boolean; sub?: string;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full py-5 rounded-full bg-neo text-white font-bold text-lg uppercase tracking-wide
               shadow-lg shadow-neo/30 hover:bg-neo-600 hover:-translate-y-0.5
               transition-all duration-200 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
  >
    {label}
    {sub && <span className="block text-xs font-semibold tracking-wider mt-1 opacity-80">{sub}</span>}
  </button>
);

export const InsightCard = ({ badge, badgeColor = 'bg-gray-900', children }: {
  badge: string; badgeColor?: string; children: React.ReactNode;
}) => (
  <div className="relative bg-white border border-gray-100 rounded-2xl p-6 pt-8 mt-6 shadow-lg text-left">
    <span className={`absolute -top-3 left-5 ${badgeColor} text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase`}>
      {badge}
    </span>
    <div className="text-gray-900 font-semibold text-base leading-relaxed">{children}</div>
  </div>
);

/** Même style de champ que le formulaire de /quiz. */
export const INPUT_CLASS =
  'w-full px-4 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-neo focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,187,177,0.1)] transition-all font-medium text-gray-900';
