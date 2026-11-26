export const spotPositions = [
  [14, 34],
  [37, 24],
  [63, 31],
  [86, 22],
  [14, 71],
  [37, 64],
  [63, 77],
  [86, 65],
] as const;

export const regionPositions: Record<string, readonly [number, number]> = {
  'mutation-crater': [15, 16],
  'mineral-cave': [47, 14],
  cliffs: [71, 14],
  'deep-sea': [88, 28],
  desert: [12, 51],
  'fossil-valley': [44, 47],
  coast: [73, 52],
  'abandoned-lab': [15, 80],
  grassland: [43, 82],
  'primal-swamp': [69, 86],
};

export default function ScoutTerrain({ regionId }: { regionId: string }) {
  return (
    <img
      className="scout-terrain"
      src={`/assets/exploration/maps/${regionId}.webp`}
      alt=""
      decoding="async"
      draggable={false}
    />
  );
}
