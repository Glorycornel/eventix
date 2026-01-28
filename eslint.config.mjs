import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname
});

const webConfigs = compat.extends(
  'next/core-web-vitals',
  'next/typescript',
  'prettier'
);

const apiConfigs = compat.extends(
  'eslint:recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:prettier/recommended'
);

export default [
  {
    ignores: ['node_modules/', 'dist/', '.next/', 'coverage/']
  },
  ...webConfigs.map((config) => ({
    ...config,
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    rules: {
      ...(config.rules || {}),
      'prettier/prettier': 'error'
    }
  })),
  ...apiConfigs.map((config) => ({
    ...config,
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      ...(config.rules || {}),
      'prettier/prettier': 'error'
    }
  }))
];
