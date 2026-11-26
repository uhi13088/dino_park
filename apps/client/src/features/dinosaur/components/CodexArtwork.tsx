import { DinosaurCategory, type DinosaurCodexEntry } from '@dino-park/shared';
import { dinosaurRasterArtwork, hybridArtworkUrl } from '@/game/parkArtwork';

export function CodexArtwork({
  entry,
  silhouette = false,
}: {
  entry: DinosaurCodexEntry;
  silhouette?: boolean;
}) {
  const imageUrl = dinosaurRasterArtwork.get(entry.speciesId)?.path ?? entry.imageUrl;
  return (
    <div className={`codex-art ${silhouette ? 'is-silhouette' : ''}`} aria-hidden="true">
      {imageUrl ? (
        <img src={hybridArtworkUrl(imageUrl)} alt="" loading="lazy" width="120" height="108" />
      ) : (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {entry.category === DinosaurCategory.PTEROSAUR ? (
            <path d="m32 35-6-16 6 5 6-5-6 16M32 35 6 23l14 22 12-10 12 10 14-22-26 12M32 35v16" />
          ) : entry.category === DinosaurCategory.MARINE ? (
            <>
              <path d="M10 32c12-17 33-17 43 0-10 17-31 17-43 0Zm0 0-7-9v18l7-9M27 21l7-9 4 9M27 43l7 9 4-9" />
              <circle cx="45" cy="29" r="1.5" />
            </>
          ) : (
            <>
              <path d="M16 20c-5-7-10-5-8 2l5 6M30 15c-2-9-8-9-8 0l2 11M44 21c3-8-2-11-6-4l-2 10M44 42c0 9-23 11-28 2-4-8 5-17 14-17s17 7 14 15Z" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
