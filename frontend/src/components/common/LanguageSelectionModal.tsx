import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import languageDetectionService from '../../services/languageDetectionService';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);

  // Language options with native names
  const languageOptions: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  ];

  // Update selected language when i18n.language changes
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
  };

  const handleConfirm = () => {
    i18n.changeLanguage(selectedLanguage);
    languageDetectionService.storeLanguage(selectedLanguage);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container for centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {t('common.selectLanguage')}
            </Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {t('common.selectLanguageDescription')}
          </p>

          <div className="space-y-2">
            {languageOptions.map((language) => (
              <button
                key={language.code}
                className={`flex items-center w-full px-4 py-3 rounded-md text-left ${
                  selectedLanguage === language.code
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <span className="text-2xl mr-3">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.name}</div>
                  <div className="text-sm text-gray-500">{language.nativeName}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleConfirm}
            >
              {t('common.confirm')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LanguageSelectionModal;
