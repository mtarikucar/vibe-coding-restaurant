import React, { useEffect, useState } from 'react';
import languageDetectionService from '../../services/languageDetectionService';
import LanguageSelectionModal from './LanguageSelectionModal';

/**
 * Component that manages language detection and first-time language selection
 */
const LanguageManager: React.FC = () => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      // Check if this is the first visit
      const hasSelectedLanguage = languageDetectionService.getStoredLanguage() !== null;
      
      if (!hasSelectedLanguage) {
        // If first visit, try to detect language automatically first
        await languageDetectionService.initializeLanguageDetection();
        
        // Then show the modal for confirmation/change
        setShowLanguageModal(true);
      } else {
        // If not first visit, just initialize with stored preference
        await languageDetectionService.initializeLanguageDetection();
      }
      
      setIsInitialized(true);
    };

    initializeLanguage();
  }, []);

  // Set document direction based on language
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.dir = languageDetectionService.getTextDirection();
    }
  }, [isInitialized]);

  const handleCloseModal = () => {
    setShowLanguageModal(false);
  };

  // This component doesn't render anything visible
  // It just manages the language detection and modal
  return (
    <>
      <LanguageSelectionModal 
        isOpen={showLanguageModal} 
        onClose={handleCloseModal} 
      />
    </>
  );
};

export default LanguageManager;
