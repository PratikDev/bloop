// Media queries the scripts need. Each matches a Tailwind breakpoint used in the class names,
// so the JS and the CSS switch layouts at the same width.

export const MEDIA = {
  /** Below Tailwind `md` (768 px): phones. The panels open as a bottom sheet. */
  phone: "(max-width: 767px)",
  /** Tailwind `xl` (1280 px) and up: the panels sit in a column beside the map. Below it they open as a sheet. */
  sideColumn: "(min-width: 1280px)",
} as const;
