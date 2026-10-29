import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { SettingsProvider } from './lib/settings-context';
import { DataProvider } from './lib/data-context';
import { WorkoutSessionProvider } from './lib/workout-context';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { CombosPage } from './pages/CombosPage';
import { AiPage } from './pages/AiPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <DataProvider>
          <BrowserRouter>
            <WorkoutSessionProvider>
              <ToastProvider>
                <ScrollToTop />
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="setup" element={<SetupPage />} />
                    <Route path="combos" element={<CombosPage />} />
                    <Route path="ai" element={<AiPage />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                  <Route path="workout" element={<WorkoutPage />} />
                </Routes>
              </ToastProvider>
            </WorkoutSessionProvider>
          </BrowserRouter>
        </DataProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
