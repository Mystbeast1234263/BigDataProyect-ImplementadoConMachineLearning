import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { FaSignOutAlt } from 'react-icons/fa';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
              <p className="text-xs text-slate-400">{t('big_data_analytics')}</p>
            </div>
          </div>

          {/* Language Selector, User Info & Logout */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user?.rol === 'admin' && t('administrator')}
                {user?.rol === 'operador' && t('operator')}
                {user?.rol === 'viewer' && t('viewer')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
