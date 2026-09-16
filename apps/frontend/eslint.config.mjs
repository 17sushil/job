/* ESLint 9 flat config for the Next.js frontend.
 * TypeScript-aware, pragmatic rule set: catches real problems without
 * blocking the team with style noise. */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      // React 19: exhaustive-deps style advice stays manual.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // JSX text with apostrophes/quotes is intentional copy, not a bug.
    files: ['**/*.tsx'],
    rules: {
      'no-unescaped-entities': 'off',
    },
  },
];
