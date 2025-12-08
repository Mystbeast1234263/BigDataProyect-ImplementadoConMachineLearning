import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';
import api from './services/api';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated, loadStoredAuth } = useAuthStore();
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [checking, setChecking] = useState(true);

  // Check backend health and Supabase status on mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // Health endpoint is at root level, not under /api
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const healthUrl = apiBaseUrl.replace('/api', '') + '/health';
        const response = await fetch(healthUrl);
        const health = await response.json();
        
        // If Supabase is not connected, allow direct access to dashboard
        if (health.supabase && !health.supabase.includes('connected')) {
          setSupabaseAvailable(false);
          // Auto-login as demo user if Supabase is not available
          const demoUser = {
            id: 'demo-admin-1',
            email: 'admin@gamc.bo',
            rol: 'admin',
          };
          const offlineToken = 'offline-demo-token-' + Date.now();
          localStorage.setItem('token', offlineToken);
          localStorage.setItem('user', JSON.stringify(demoUser));
          localStorage.setItem('offline_mode', 'true');
          useAuthStore.getState().setUser(demoUser);
          useAuthStore.getState().setToken(offlineToken);
          useAuthStore.getState().isAuthenticated = true;
        }
      } catch (error) {
        console.warn('Backend health check failed, allowing offline mode');
        setSupabaseAvailable(false);
        // Auto-login as demo user
        const demoUser = {
          id: 'demo-admin-1',
          email: 'admin@gamc.bo',
          rol: 'admin',
        };
        const offlineToken = 'offline-demo-token-' + Date.now();
        localStorage.setItem('token', offlineToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('offline_mode', 'true');
        useAuthStore.getState().setUser(demoUser);
        useAuthStore.getState().setToken(offlineToken);
        useAuthStore.getState().isAuthenticated = true;
      } finally {
        setChecking(false);
      }
    };

    loadStoredAuth();
    checkBackendHealth();
  }, []);

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Verificando conexiones...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            supabaseAvailable && !isAuthenticated ? (
              <Login />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            supabaseAvailable ? (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <Dashboard />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
