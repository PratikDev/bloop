// One look for every action in the dock: icon above a small label (a tab-bar feel, easy to hit with a thumb; below
// 1024 px the buttons share the row's width, so six fit at 320 px; from 1024 px each is as wide as its word, so every
// Listen action fits whole at 1280 and 1366 px, the common laptops), icon beside the longer label from 1536 px.
export const DOCK_BUTTON =
  "relative h-12 max-w-24 min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-1 text-small font-normal text-haze hover:bg-tide/70 hover:text-moon aria-expanded:bg-tide aria-expanded:text-moon aria-pressed:text-moon lg:flex-none lg:px-1.5 2xl:h-11 2xl:max-w-none 2xl:flex-none 2xl:flex-row 2xl:gap-2 2xl:px-3 2xl:text-body [&_svg]:size-5";

/** The visible short word (below 1536 px) and the longer label (from 1536 px); both are part of the button's name. */
export const DOCK_SHORT_LABEL = "2xl:hidden";
export const DOCK_LONG_LABEL = "hidden 2xl:inline";
