module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/'],
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
      extends: ['next/core-web-vitals', 'next/typescript', 'prettier']
    },
    {
      files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
      ],
      rules: {
        'prettier/prettier': 'error'
      }
    }
  ]
};
