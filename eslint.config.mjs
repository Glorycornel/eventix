import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname
});

function mergeFlatConfigs(configs) {
  return configs.reduce((acc, config) => {
    Object.entries(config || {}).forEach(([key, value]) => {
      if (value == null) {
        return;
      }
      if (key === 'plugins') {
        acc.plugins = { ...acc.plugins, ...value };
      } else if (key === 'rules') {
        acc.rules = { ...acc.rules, ...value };
      } else if (
        key === 'languageOptions' ||
        key === 'settings' ||
        key === 'globals' ||
        key === 'linterOptions'
      ) {
        acc[key] = { ...acc[key], ...value };
      } else {
        acc[key] = value;
      }
    });
    return acc;
  }, {});
}

const webConfig = mergeFlatConfigs(
  compat.extends('next/core-web-vitals', 'next/typescript', 'prettier')
);

const apiConfig = mergeFlatConfigs(
  compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  )
);

export default [
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    ...webConfig,
    ignores: ['node_modules/', 'dist/', '.next/', 'coverage/']
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    ...apiConfig,
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: { sourceType: 'module' }
    },
    rules: {
      ...(apiConfig.rules || {}),
      'prettier/prettier': 'error'
    }
  }
];
