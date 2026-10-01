// One look for every action in the dock: icon above a small label below 1024 px
// (a tab-bar feel, easy to hit with a thumb; the buttons share the row's width,
// so six fit at 320 px), icon beside the label from 1024 px.
export const DOCK_BUTTON =
  "relative h-12 max-w-24 min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-1 text-small font-normal text-haze hover:bg-tide/70 hover:text-moon aria-expanded:bg-tide aria-expanded:text-moon aria-pressed:text-moon lg:h-11 lg:max-w-none lg:flex-none lg:flex-row lg:gap-2 lg:px-3 lg:text-body [&_svg]:size-5";
