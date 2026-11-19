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
import { PlaceholderPage } from './pages/Placeholder/PlaceholderPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="property/:id" element={<PropertyDetailPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hosting" element={<HostingPage />} />
            <Route path="map" element={<PlaceholderPage icon="📍" title="Map View" description="Explore properties on an interactive map with GPS-verified locations." />} />
            <Route path="feed" element={<PlaceholderPage icon="▶" title="Explore Feed" description="Discover new properties through a curated feed of listings." />} />
            <Route path="inspections" element={<PlaceholderPage icon="☑" title="My Inspections" description="Schedule and track property inspections with photo documentation." />} />
            <Route path="hosting/new" element={<PlaceholderPage icon="➕" title="List a Property" description="Add your property with GPS verification and reach thousands of tenants." />} />
            <Route path="settings" element={<PlaceholderPage icon="⚙" title="Settings" description="Account settings, notifications, privacy, and app preferences." />} />
            <Route path="*" element={<PlaceholderPage icon="404" title="Page Not Found" description="The page you're looking for doesn't exist." />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
