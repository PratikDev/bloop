// The DATA pages' paths (src/router/routes.tsx registers them; src/app/[[...path]]/page.tsx prerenders them).
export const DATA_HEALTH_SEGMENT = "data-health";
export const DATA_HEALTH_PATH = `/${DATA_HEALTH_SEGMENT}` as const;
