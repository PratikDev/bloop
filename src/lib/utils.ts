import { createCn } from "cn/config";

/**
 * Class merging that knows our design tokens (globals.css @theme). Without this,
 * custom sizes like `text-lead` look like text colours and get dropped when a
 * colour such as `text-ink` follows them.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["small", "body", "lead", "title", "readout", "readout-mobile"] }],
      rounded: [{ rounded: ["sheet"] }],
      "rounded-t": [{ "rounded-t": ["sheet"] }],
      "rounded-l": [{ "rounded-l": ["sheet"] }],
      "rounded-tr": [{ "rounded-tr": ["sheet"] }],
    },
  },
});
