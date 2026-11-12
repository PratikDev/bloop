const DOCK_KEY = "key border-navy relative rounded-lg bg-paper font-normal text-moon hover:bg-paper aria-expanded:bg-tide aria-pressed:bg-tide [&_svg]:size-5";

// One look for every action in the dock: icon above a small label below 1024 px
// (a tab-bar feel, easy to hit with a thumb; the buttons share the row's width,
// so six fit at 320 px), icon beside the label from 1024 px.
export const DOCK_BUTTON = `${DOCK_KEY} h-12 max-w-24 min-w-0 flex-1 flex-col gap-0.5 px-1 text-small lg:h-11 lg:max-w-none lg:flex-none lg:flex-row lg:gap-2 lg:px-3 lg:text-body`;

// Records and More: the 1024 px look (icon beside the label) from 640 px; below it, a square icon key.
export const DOCK_BUTTON_FIXED = `${DOCK_KEY} h-11 shrink-0 flex-row gap-2 px-3 text-body max-sm:w-11 max-sm:px-0`;
