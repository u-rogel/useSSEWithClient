module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'standard-with-typescript',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"]
    },
    "import/resolver": {
      "typescript": {
        paths: "./tsconfig.json",
        alwaysTryTypes: true
      }
    },
  },
  rules: {
    'linebreak-style': 0,
    'no-return-await': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    quotes: [2, 'single'],
    semi: [2, 'always'],
    '@typescript-eslint/semi': [2, 'always'],
    'comma-dangle': [2, 'always-multiline'],
    '@typescript-eslint/comma-dangle': [2, 'always-multiline'],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'import/extensions': ['error', 'always', { js: 'never', ts: 'never' }],
    'operator-linebreak': ['error', 'before'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/space-before-function-paren': 'off',
  },
}
