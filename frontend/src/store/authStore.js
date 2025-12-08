import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setError: (error) => set({ error }),

  login: async (email, password, allowOffline = false) => {
    set({ isLoading: true, error: null });
    
    // Credenciales demo válidas para modo offline
    const demoUsers = {
      'admin@gamc.bo': { password: 'admin123', rol: 'admin', id: 'demo-admin-1' },
      'operador@gamc.bo': { password: 'operador123', rol: 'operador', id: 'demo-operador-1' },
      'viewer@gamc.bo': { password: 'viewer123', rol: 'viewer', id: 'demo-viewer-1' },
    };

    try {
      const response = await authAPI.login(email, password);
      const { access_token, user_id, email: userEmail, rol } = response.data;

      const user = {
        id: user_id,
        email: userEmail,
        rol,
      };

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      // Si el backend no está disponible y allowOffline es true, permitir login offline
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.message?.includes('Network Error') || 
                            error.message?.includes('ERR_CONNECTION_REFUSED') ||
                            !error.response;
      
      if (isNetworkError && allowOffline) {
        // Verificar credenciales demo localmente
        const demoUser = demoUsers[email.toLowerCase()];
        if (demoUser && demoUser.password === password) {
          const user = {
            id: demoUser.id,
            email: email.toLowerCase(),
            rol: demoUser.rol,
          };

          // Crear un token dummy para modo offline
          const offlineToken = 'offline-demo-token-' + Date.now();
          localStorage.setItem('token', offlineToken);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('offline_mode', 'true');

          set({
            token: offlineToken,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } else {
          set({ 
            error: 'Credenciales incorrectas. Usa: admin@gamc.bo / admin123', 
            isLoading: false 
          });
          return false;
        }
      }
      
      let errorMsg = 'Error al iniciar sesión';
      
      if (isNetworkError && !allowOffline) {
        // Si es error de red y no se ha intentado offline, intentar automáticamente
        const demoUser = demoUsers[email.toLowerCase()];
        if (demoUser && demoUser.password === password) {
          const user = {
            id: demoUser.id,
            email: email.toLowerCase(),
            rol: demoUser.rol,
          };

          const offlineToken = 'offline-demo-token-' + Date.now();
          localStorage.setItem('token', offlineToken);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('offline_mode', 'true');

          set({
            token: offlineToken,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        }
        errorMsg = 'No se puede conectar al servidor. Usa credenciales demo para modo offline.';
      } else if (error.response?.status === 401) {
        errorMsg = error.response?.data?.detail || 'Email o contraseña incorrectos';
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(email, password);
      const { access_token, user_id, email: userEmail, rol } = response.data;

      const user = {
        id: user_id,
        email: userEmail,
        rol,
      };

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadStoredAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        set({
          token,
          user: parsedUser,
          isAuthenticated: true,
        });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.getCurrentUser();
      const user = {
        id: response.data.id,
        email: response.data.email,
        rol: response.data.rol,
      };
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load user' });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
