import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'web-build/**', 'babel.config.js', 'jest.config.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message:
            'Quy tắc bắt buộc (Bước 1.2): Tuyệt đối không viết mã màu hex (#...) ngoài file src/theme/tokens.ts.',
        },
      ],
    },
  },
  {
    files: ['src/theme/tokens.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
