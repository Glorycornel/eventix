import parser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname
});

const [baseConfig] = compat.extends('plugin:@typescript-eslint/recommended');

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['node_modules/', '.next/'],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    rules: {
      ...(baseConfig.rules || {}),
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/no-onchange': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];
