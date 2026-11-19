/** First playable park, based on the scenario's first hatch and existing catalog IDs. */
export const STARTER_PARK = {
  receiptFlag: 'starter-park-v1',
  dinosaur: {
    speciesId: 'parasaurolophus',
    nickname: '파라',
    happiness: 75,
    hunger: 45,
    positionX: 9,
    positionY: 9,
    isInPark: false,
  },
  buildings: [
    { typeId: 'habitat-grassland', positionX: 8, positionY: 8 },
    { typeId: 'operation-entrance-gate', positionX: 11, positionY: 16 },
  ],
} as const;
