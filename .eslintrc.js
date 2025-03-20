module.exports = {
  root: true,
  env: {
    mocha: true,
    jest: true,
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  overrides: [{
    files: ['*.ts', '*.tsx'],
  }],
  rules: {
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
  },
};
