// Pages
export { default as GreatFigurePage } from './pages/GreatFigurePage';

// Components
export { default as GreatFigureDetail } from './components/GreatFigureDetail';
export { default as GreatFigureAssign, GreatFigureCard } from './components/GreatFigureAssign';

// Store
export {
  useGreatFigureStore,
  useOwnedFiguresCount,
  useAssignedFiguresCount,
  useCanAffordRecruit,
  JOB_CONFIG,
  RARITY_CONFIG,
  type GreatFigure,
  type GreatFigureType,
  type GreatFigureJob,
  type GreatFigureRarity,
  type GreatFigureAbility,
  type SynergyInfo,
  type Building,
} from './stores/useGreatFigureStore';
