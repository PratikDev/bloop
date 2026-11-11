// The static HTML ships lang="en", so a Bangla visitor's page reported "en" until the app's JS ran.
// This tiny script runs inline in <head>, before the body is parsed, and sets <html lang> from the same saved prefs
// the app reads (prefs.ts). Wrapped in try/catch: blocked storage just leaves the default.

import { LANGS } from "@/lib/i18n/types";
import { PREFS_STORAGE_KEY } from "./prefs";

export const LANG_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_STORAGE_KEY)})||"{}");var l=p&&p.lang;if(${JSON.stringify(LANGS)}.indexOf(l)>=0)document.documentElement.lang=l}catch(e){}})();`;
