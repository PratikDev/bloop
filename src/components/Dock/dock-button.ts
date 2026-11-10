// One look for every action in the dock: icon above a small label below 1024 px
// (a tab-bar feel, easy to hit with a thumb; the buttons share the row's width,
// so six fit at 320 px), icon beside the label from 1024 px.
export const DOCK_BUTTON =
  "key border-navy relative h-12 max-w-24 min-w-0 flex-1 flex-col gap-0.5 rounded-lg bg-paper px-1 text-small font-normal text-moon hover:bg-paper aria-expanded:bg-tide aria-pressed:bg-tide lg:h-11 lg:max-w-none lg:flex-none lg:flex-row lg:gap-2 lg:px-3 lg:text-body [&_svg]:size-5";
