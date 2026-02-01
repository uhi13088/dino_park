import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '@components/layout/MainLayout';
import LoadingScreen from '@components/ui/LoadingScreen';

// Lazy load pages
const HomePage = lazy(() => import('@features/park/pages/HomePage'));
const ParkPage = lazy(() => import('@features/park/pages/ParkPage'));
const DinosaurPage = lazy(() => import('@features/dinosaur/pages/DinosaurPage'));
const ExplorationPage = lazy(() => import('@features/exploration/pages/ExplorationPage'));
const StoryPage = lazy(() => import('@features/story/pages/StoryPage'));
const ShopPage = lazy(() => import('@features/shop/pages/ShopPage'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="park" element={<ParkPage />} />
          <Route path="dinosaur" element={<DinosaurPage />} />
          <Route path="exploration" element={<ExplorationPage />} />
          <Route path="story" element={<StoryPage />} />
          <Route path="shop" element={<ShopPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
