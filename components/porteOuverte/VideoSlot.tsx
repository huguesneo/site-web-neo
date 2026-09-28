import { Play } from 'lucide-react';

/**
 * Emplacement vidéo 16:9. Tant que `src` est vide, un cadre réservé tient la
 * place — on voit où la vidéo ira sans jamais afficher un lecteur cassé.
 */
export default function VideoSlot({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
      {src ? (
        <video src={src} controls playsInline preload="metadata" className="block aspect-video w-full" />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-gray-400">
          <Play size={40} />
          <span className="text-sm">Vidéo à venir</span>
        </div>
      )}
    </div>
  );
}
