// Media queries the scripts need. Each matches a Tailwind breakpoint used in the class names,
// so the JS and the CSS switch layouts at the same width.

export const MEDIA = {
  /** Below Tailwind `md` (768 px): phones. Sheets open from the bottom. */
  phone: "(max-width: 767px)",
  /** Tailwind `lg` (1024 px) and up: plates and the Inspector sit on the map. Below it they stack under the map, and the Inspector is a sheet. */
  mapOverlay: "(min-width: 1024px)",
} as const;
