import { en } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";
export type Content = typeof en;

export const content: Record<Language, Content> = {
  en,
  ar,
};
