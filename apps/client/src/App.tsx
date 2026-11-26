import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '@components/layout/MainLayout';
import LoadingScreen from '@components/ui/LoadingScreen';

// Lazy load pages
const HomePage = lazy(() => import('@features/park/pages/HomePage'));
const ParkPage = lazy(() => import('@features/park/pages/ParkPage'));
const ParkSafariPage = lazy(() => import('@features/park/pages/ParkSafariPage'));
const SafariPreviewPage = lazy(() => import('@features/park/pages/SafariPreviewPage'));
const StegosaurusRealtimePage = lazy(() => import('@features/park/pages/StegosaurusRealtimePage'));
const DinosaurPage = lazy(() => import('@features/dinosaur/pages/DinosaurPage'));
const ExplorationPage = lazy(() => import('@features/exploration/pages/ExplorationPage'));
const ResearchPage = lazy(() => import('@features/research/ResearchPage'));
const ExperimentalHybridPage = lazy(() => import('@features/research/ExperimentalHybridPage'));
const StoryPage = lazy(() => import('@features/story/pages/StoryPage'));
const ShopPage = lazy(() => import('@features/shop/pages/ShopPage'));
const GreatFigurePage = lazy(() => import('@features/greatFigure/pages/GreatFigurePage'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="park" element={<ParkPage />} />
          <Route path="park/safari" element={<ParkSafariPage />} />
          <Route path="park/safari-preview" element={<SafariPreviewPage />} />
          <Route path="park/3d-preview" element={<StegosaurusRealtimePage />} />
          <Route path="dinosaur" element={<DinosaurPage />} />
          <Route path="exploration" element={<ExplorationPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="research/hybrids" element={<ExperimentalHybridPage />} />
          <Route path="story" element={<StoryPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="great-figures" element={<GreatFigurePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
