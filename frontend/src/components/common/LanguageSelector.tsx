import { useState, useEffect, useRef } from"react";
import { useTranslation } from"react-i18next";
import { GlobeAltIcon, CheckIcon } from"@heroicons/react/24/outline";

interface Language {
 code: string;
 name: string;
 flag: string;
}

const LanguageSelector = () => {
 const { i18n, t } = useTranslation();
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const languages: Language[] = [
  { code:"en", name: t("common.languages.en"), flag: "🇺🇸" },
  { code:"es", name: t("common.languages.es"), flag: "🇪🇸" },
  { code:"fr", name: t("common.languages.fr"), flag: "🇫🇷" },
  { code:"tr", name: t("common.languages.tr"), flag: "🇹🇷" },
 ];

 // Get current language
 const currentLanguage =
  languages.find((lang) => lang.code === i18n.language) || languages[0];

 const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  // Save language preference to localStorage
  localStorage.setItem("preferredLanguage", lng);
  setIsOpen(false);
 };

 // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (
    dropdownRef.current &&
    !dropdownRef.current.contains(event.target as Node)
   ) {
    setIsOpen(false);
   }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
   document.removeEventListener("mousedown", handleClickOutside);
  };
 }, []);

 // Load preferred language from localStorage on component mount
 useEffect(() => {
  const savedLanguage = localStorage.getItem("preferredLanguage");
  if (savedLanguage && savedLanguage !== i18n.language) {
   i18n.changeLanguage(savedLanguage);
  }
 }, [i18n]);

 return (
  <div className="relative" ref={dropdownRef}>
   <button
    type="button"
    className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
    onClick={() => setIsOpen(!isOpen)}
    aria-expanded={isOpen}
    aria-haspopup="true"
   >
    <span className="mr-2 text-lg">{currentLanguage.flag}</span>
    <span className="hidden md:inline mr-1">{currentLanguage.name}</span>
    <GlobeAltIcon className="h-5 w-5" />
   </button>

   {isOpen && (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 animate-fadeIn">
     <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
      {t("common.language")}
     </div>
     {languages.map((language) => (
      <button
       key={language.code}
       className={`flex items-center justify-between px-4 py-3 text-sm w-full text-left hover:bg-gray-50 transition-colors ${
        i18n.language === language.code
         ?"text-blue-600 bg-blue-50"
         :"text-gray-700"
       }`}
       onClick={() => changeLanguage(language.code)}
      >
       <div className="flex items-center">
        <span className="text-lg mr-3">{language.flag}</span>
        <span>{language.name}</span>
       </div>
       {i18n.language === language.code && (
        <CheckIcon className="h-5 w-5 text-blue-600" />
       )}
      </button>
     ))}
    </div>
   )}
  </div>
 );
};

export default LanguageSelector;
