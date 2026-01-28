module.exports = {
  "*.{ts,tsx,js,jsx,json,md,css,scss}": "prettier --write",
  "apps/api/**/*.ts": "pnpm --filter @eventix/api exec eslint --fix",
  "packages/**/*.ts": "pnpm exec eslint --fix",
  "apps/web/**/*.{ts,tsx,js,jsx}": "pnpm --filter @eventix/web exec eslint --fix"
};
