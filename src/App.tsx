import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { HomePage } from './pages/Home/HomePage';
import { SearchPage } from './pages/Search/SearchPage';
import { PropertyDetailPage } from './pages/PropertyDetail/PropertyDetailPage';
import { LoginPage } from './pages/Login/LoginPage';
import { SavedPage } from './pages/Saved/SavedPage';
import { MessagesPage } from './pages/Messages/MessagesPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { HostingPage } from './pages/Hosting/HostingPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { FeedPage } from './pages/Feed/FeedPage';
import { PlaceholderPage } from './pages/Placeholder/PlaceholderPage';
import { InspectionWizardPage } from './pages/Inspections/InspectionWizardPage';
import { MyInspectionsPage } from './pages/Inspections/MyInspectionsPage';

// Leaflet is heavy and only this screen needs it.
const MapPage = lazy(() =>
  import('./pages/Map/MapPage').then(m => ({ default: m.MapPage })),
);
const PropertyMapPage = lazy(() =>
  import('./pages/PropertyMap/PropertyMapPage').then(m => ({ default: m.PropertyMapPage })),
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="property/:id" element={<PropertyDetailPage />} />
            <Route path="property/:id/inspection" element={<InspectionWizardPage />} />
            <Route path="property/:id/map" element={<Suspense fallback={null}><PropertyMapPage /></Suspense>} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hosting" element={<HostingPage />} />
            <Route path="map" element={<Suspense fallback={null}><MapPage /></Suspense>} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="inspections" element={<MyInspectionsPage />} />
            <Route path="hosting/new" element={<PlaceholderPage icon="➕" title="List a Property" description="Add your property with GPS verification and reach thousands of tenants." />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<PlaceholderPage icon="404" title="Page Not Found" description="The page you're looking for doesn't exist." />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
