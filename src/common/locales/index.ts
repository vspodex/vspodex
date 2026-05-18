import { en } from "./en";
import { ja } from "./ja";
import { zh } from "./zh";

export const translations = {
  en,
  ja,
  zh,
};

export type TranslationKey = keyof typeof en;
