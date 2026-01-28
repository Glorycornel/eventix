module.exports = {
  "*.{ts,tsx,js,jsx,json,md,css,scss}": "prettier --write",
  "apps/api/**/*.ts": "ESLINT_USE_FLAT_CONFIG=false pnpm --filter @eventix/api exec eslint --fix",
  "packages/**/*.ts": "ESLINT_USE_FLAT_CONFIG=false pnpm exec eslint --fix",
  "apps/web/**/*.{ts,tsx,js,jsx}": "pnpm --filter @eventix/web exec eslint --fix --ext .ts,.tsx,.js,.jsx"
};
