import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    // Permitir login offline si el backend no está disponible
    const allowOffline = backendStatus === 'offline';
    const success = await login(email, password, allowOffline);
    if (success) {
      navigate('/dashboard');
    } else {
      setLocalError(useAuthStore.getState().error);
    }
  };

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await authAPI.getDemoUsers();
        setBackendStatus('online');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setLocalError('');
    clearError();
    setEmail(demoEmail);
    
    // Permitir login incluso si el backend está offline (modo demo)
    const success = await login(demoEmail, demoPassword, true);
    if (success) {
      navigate('/dashboard');
    } else {
      const errorMsg = useAuthStore.getState().error;
      setLocalError(errorMsg || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">GAMC Dashboard</h1>
          <p className="text-slate-400">Big Data Sensor Analytics</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          {/* Backend Status */}
          {backendStatus === 'offline' && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg text-yellow-400 text-sm">
              <strong>⚠️ Modo Offline:</strong> El backend no está disponible, pero puedes acceder en modo demo. 
              Algunas funcionalidades pueden estar limitadas.
            </div>
          )}
          
          {backendStatus === 'online' && (
            <div className="mb-4 p-2 bg-green-900/20 border border-green-500 rounded-lg text-green-400 text-xs text-center">
              ✓ Backend conectado
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {localError || error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError('');
                }}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="admin@gamc.bo"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError('');
                }}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-8 border-t border-slate-700 pt-6">
            <p className="text-sm text-slate-400 mb-4">Demo Credentials:</p>
            <div className="space-y-2">
              <button
                onClick={() => handleDemoLogin('admin@gamc.bo', 'admin123')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium text-sm py-2 px-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>👤</span>
                    <span>Admin: admin@gamc.bo</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDemoLogin('operador@gamc.bo', 'operador123')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm py-2 px-3 rounded-lg transition duration-200"
                disabled={isLoading}
              >
                Operator: operador@gamc.bo
              </button>
              <button
                onClick={() => handleDemoLogin('viewer@gamc.bo', 'viewer123')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm py-2 px-3 rounded-lg transition duration-200"
                disabled={isLoading}
              >
                Viewer: viewer@gamc.bo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          GAMC Big Data Dashboard © 2025
        </p>
      </div>
    </div>
  );
}
