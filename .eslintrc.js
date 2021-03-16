/**
  Enabling ESLint on TS files in VSCode
  One final note for all you VSCode users out there - by default the ESLint
  plugin only runs on javascript and javascriptreact files. To tell it to run on
  TS files, you need to update the eslint.validate setting to:

  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
 */

module.exports = {
  root: true,
  /**
   * parser: '@typescript-eslint/parser' tells ESLint to use the parser package you
   * installed (@typescript-eslint/parser).
   * This allows ESLint to understand TypeScript syntax.
   * This is required, or else ESLint will throw errors as it tries to parse TypeScript
   * code as if it were regular JavaScript.
   */
  parser: '@typescript-eslint/parser',
  parserOptions: { // Parser options: https://miro.medium.com/max/1640/1*HRABdfNr2DHpNfrgpjqO0Q.png
    ecmaVersion: 10,
    sourceType: 'module',
    ecmaFeatures: {
      "modules": true,
    },
    /**
     * NOTE:
     * You can create a separate TypeScript config file (tsconfig.eslint.json)
     * intended for eslint configuration. That file extends tsconfig configuration
     * and setups include key for files that have to be linted.
     * 
     * This solves errors such as:
     *    Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser.
     *    - The file does not match your project config: tests\**\index.ts.
     *    - The file must be included in at least one of the projects provided
     */
    project: ['./tsconfig.eslint.json'],
  },
  /**
   * plugins: ['@typescript-eslint'] tells ESLint to load the plugin package you
   * installed (@typescript-eslint/eslint-plugin). This allows you to use the rules
   * within your codebase.
   */
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  env: {
    es6: true,
    node: true,
  },
  /**
   * extends: [ ... ] tells ESLint that your config extends the given configurations.
   * eslint:recommended is ESLint's inbuilt "recommended" config - it turns on a small,
   * sensible set of rules which lint for well-known best-practices.
   * plugin:@typescript-eslint/eslint-recommended is a configuration we provide which
   * disables a few of the recommended rules from the previous set that we know are already
   * covered by TypeScript's typechecker.
   * plugin:@typescript-eslint/recommended is our "recommended" config - it's just like
   * eslint:recommended, except it only turns on rules from our TypeScript-specific plugin.
   */
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended', // A plugin that contains a bunch of ESLint rules that are TypeScript specific.
    'eslint-config-prettier', // Disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:jest/recommended',
  ],
  rules: {
    //
    // @typescript-eslint
    //
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/unbound-method': 'off',
    'no-empty-function': 'off', // replaced by @typescript-eslint/no-empty-function
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] },
    ],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    //
    // eslint base
    //
    'comma-dangle': ['error', 'always-multiline'],
    'constructor-super': 'off',
    curly: ['error', 'all'],
    'no-mixed-operators': 'error',
    'no-console': 'error',
    'no-process-exit': 'error',
    //
    // More imports below
    //
  },
  overrides: [
    // all test files
    {
      files: [
        '**/*.test.ts',
      ],
      env: {
        'jest/globals': true,
      },
      rules: {
        // 'eslint-plugin/no-identical-tests': 'error',
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-alias-methods': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-jasmine-globals': 'error',
        'jest/no-jest-import': 'error',
        'jest/no-test-prefixes': 'error',
        // 'jest/no-test-callback': 'error',
        'jest/no-test-return-statement': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/prefer-spy-on': 'error',
        'jest/valid-expect': 'error',
      },
    },
    // tools and tests
    {
      files: ['**/tools/**/*.ts', '**/tests/**/*.ts'],
      rules: {
        // allow console logs in tools and tests
        'no-console': 'off',
      },
    },
    // generated schema.d.ts file
    {
      files: ['./src/types/schema.d.ts'],
      rules: {
        // allow explicit any on the generated files
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
