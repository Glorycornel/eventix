import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname,
  recommendedConfig: 'eslint:recommended'
});

const [baseConfig] = compat.extends('plugin:@typescript-eslint/recommended');

export default [
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/', 'dist/', '.next/', 'coverage/'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module'
      }
    },
    ...baseConfig
  }
];
