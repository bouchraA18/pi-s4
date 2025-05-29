import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

i18n
  .use(HttpApi) // Charge les fichiers JSON de traduction
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Intègre i18n à React
  .init({
    supportedLngs: ["fr", "ar"],
    fallbackLng: "fr",
    debug: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;