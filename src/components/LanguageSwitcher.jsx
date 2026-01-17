import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const languageOptions = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'my', label: 'မြန်မာ', flag: '🇲🇲' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = i18n.language || 'en';
  const currentLang = languageOptions.find(lang => lang.value === currentLanguage) || languageOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-100/50 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 flex-shrink-0" />
        <span className="text-base sm:text-lg flex-shrink-0">{currentLang.flag}</span>
        <span className="hidden sm:inline text-xs sm:text-sm text-gray-700 font-medium truncate">
          {currentLang.label}
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
          {languageOptions.map((lang) => (
            <button
              key={lang.value}
              onClick={() => changeLanguage(lang.value)}
              className={`w-full text-left px-3 py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors ${
                currentLanguage === lang.value
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base flex-shrink-0">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {currentLanguage === lang.value && (
                <span className="ml-auto text-blue-600 flex-shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
