import { useSettings } from "./store";
import { translations, TranslationKey } from "~/common/locales";
import { Language } from "~/common/types";

export function useTranslation() {
  const [settings] = useSettings();
  const lang = (settings?.general?.language || "en") as Language;
  const dictionary = translations[lang] || translations.en;

  const t = (key: TranslationKey): string => {
    return (dictionary[key] ?? translations.en[key] ?? key) as string;
  };

  return { t, lang };
}
