// Conditions affichées sous les prix, sur la page publique et la page naturo.
export default function Conditions({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 sm:px-6 ${className}`}>
      <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">Les conditions, clairement</h3>
      <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc pl-5 marker:text-neo">
        <li>
          <strong className="font-bold">Mensuel :</strong> aucun engagement, tu paies mois par mois.
        </li>
        <li>
          <strong className="font-bold">Engagement de 6 ou 12 mois :</strong> l&apos;abonnement ne peut pas être
          annulé avant la fin de l&apos;engagement. Tu peux toutefois passer au mensuel en payant la différence
          de prix sur les mois déjà payés.
        </li>
        <li>
          À la fin de l&apos;engagement, ton forfait continue au même prix, mois par mois.
        </li>
        <li>
          Tu es présentement en programme ? Ton premier paiement a lieu à la semaine 15.
        </li>
        <li>Les prix sont affichés par mois, avant taxes.</li>
      </ul>
    </div>
  );
}
