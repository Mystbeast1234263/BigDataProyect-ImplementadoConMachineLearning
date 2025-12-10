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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center p-4 overflow-hidden relative">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
            GAMC Dashboard
          </h1>
          <p className="text-slate-400 font-medium tracking-wide uppercase text-xs opacity-80">
            Big Data Sensor Analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          {/* Top colored line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Bienvenido</h2>

          {/* Backend Status */}
          {backendStatus === 'offline' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm backdrop-blur-sm animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                 <span className="text-xl">⚠️</span>
                 <div>
                    <strong className="block text-yellow-400 mb-1">Modo Offline Detectado</strong>
                    <span className="opacity-90">El servidor no responde. Puedes acceder en modo demostración con funcionalidad limitada.</span>
                 </div>
              </div>
            </div>
          )}
          
          {backendStatus === 'online' && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm backdrop-blur-sm animate-in shake">
               <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{localError || error}</span>
               </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError('');
                  }}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  placeholder="ejemplo@gamc.bo"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError('');
                  }}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {isLoading ? (
                 <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Iniciando sesión...
                 </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">Accesos Rápidos (Demo)</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleDemoLogin('admin@gamc.bo', 'admin123')}
                className="group relative w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl transition-all duration-200 hover:border-blue-500/30"
                disabled={isLoading}
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">A</div>
                    <div className="text-left">
                       <div className="text-sm font-bold text-slate-200 group-hover:text-white">Administrador</div>
                       <div className="text-xs text-slate-500">Full Access</div>
                    </div>
                 </div>
                 <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                 <button
                   onClick={() => handleDemoLogin('operador@gamc.bo', 'operador123')}
                   className="px-3 py-2 bg-slate-800/30 hover:bg-slate-700/30 border border-white/5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors text-center"
                   disabled={isLoading}
                 >
                   Operador Demo
                 </button>
                 <button
                   onClick={() => handleDemoLogin('viewer@gamc.bo', 'viewer123')}
                   className="px-3 py-2 bg-slate-800/30 hover:bg-slate-700/30 border border-white/5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors text-center"
                   disabled={isLoading}
                 >
                   Viewer Demo
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs font-medium mt-8 tracking-wide">
          GAMC Big Data Dashboard © 2025 • Secured System
        </p>
      </div>
    </div>
  );
}
