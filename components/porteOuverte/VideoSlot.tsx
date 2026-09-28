import { Play } from 'lucide-react';

/**
 * Emplacement vidéo 16:9. Tant que `src` est vide, un cadre réservé tient la
 * place — on voit où la vidéo ira sans jamais afficher un lecteur cassé.
 *
 * Lecture automatique : les navigateurs ne l'autorisent qu'en sourdine, d'où
 * `muted`. Les contrôles restent visibles pour que la personne active le son.
 */
export default function VideoSlot({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
      {src ? (
        <video
          src={src}
          autoPlay
          muted
          playsInline
          controls
          preload="auto"
          className="block aspect-video w-full"
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-gray-400">
          <Play size={40} />
          <span className="text-sm">Vidéo à venir</span>
        </div>
      )}
    </div>
  );
}
