import { useLanguage } from '../contexts/LanguageContext';
import { useState } from 'react';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'qu', name: 'Runa Simi', flag: '🇵🇪' },
  { code: 'ay', name: 'Aymar Aru', flag: '🇧🇴' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        title="Change Language / Cambiar Idioma"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden md:inline">{currentLanguage.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                  language === lang.code ? 'bg-slate-700 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-white text-sm font-medium">{lang.name}</span>
                {language === lang.code && (
                  <span className="ml-auto text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



