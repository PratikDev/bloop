import { LANGS } from "@/lib/i18n/types";
import { PREFS_STORAGE_KEY } from "./prefs";

export const LANG_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_STORAGE_KEY)})||"{}");var l=p&&p.lang;if(${JSON.stringify(LANGS)}.indexOf(l)>=0)document.documentElement.lang=l}catch(e){}})();`;
