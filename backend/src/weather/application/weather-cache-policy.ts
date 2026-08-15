export const weatherCachePolicy = {
  coordinatePrecision: 2,
  ttlSeconds: {
    current: 300,
    hourly: 900,
    daily: 3600,
  },
} as const;
