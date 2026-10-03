import { createCn } from "cn/config";

/**
 * Class merging that knows our design tokens (globals.css @theme). Without this,
 * custom sizes like `text-lead` look like text colours and get dropped when a
 * colour such as `text-ink` follows them.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["small", "body", "lead", "title", "headline", "display", "readout", "readout-mobile", "readout-strip"] }],
      rounded: [{ rounded: ["sheet", "plate"] }],
      "rounded-t": [{ "rounded-t": ["sheet"] }],
      "rounded-l": [{ "rounded-l": ["sheet"] }],
      "rounded-tr": [{ "rounded-tr": ["sheet", "plate"] }],
      "rounded-tl": [{ "rounded-tl": ["sheet", "plate"] }],
      "rounded-r": [{ "rounded-r": ["sheet"] }],
    },
  },
});
