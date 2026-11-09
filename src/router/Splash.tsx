import { appEn } from "@/lib/i18n/en/app";

/** What the server sends before the app's code runs: the name on the page ground, no layout shift into the app. */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <p translate="no" className="font-wide text-title text-haze">{appEn["app.title"]}</p>
    </div>
  );
}
