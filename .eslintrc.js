/** *****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'airbnb-base',
		'prettier',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
	],
	plugins: ['react-hooks', 'prettier'],
	env: {
		browser: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {
		'import/no-unresolved': 'error',
		'import/named': 'error',
		'import/default': 'error',
		'import/first': 'error',
		'import/no-duplicates': 'error',
		'import/newline-after-import': 'error',
		'import/extensions': 'off',
		'import/prefer-default-export': 'off',
		'import/no-cycle': 'off',
		'no-tabs': 'off',
		'max-len': [
			'error',
			{
				tabWidth: 2,
				code: 100,
			},
		],
		semi: 'off',
		'@typescript-eslint/semi': ['error'],
		'@typescript-eslint/member-delimiter-style': [
			'error',
			{
				multiline: {
					delimiter: 'semi',
					requireLast: true,
				},
				singleline: {
					delimiter: 'semi',
					requireLast: false,
				},
			},
		],
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/ban-types': 'off',
		'implicit-arrow-linebreak': 'off',
		'arrow-parens': ['error', 'as-needed'],
		'no-plusplus': 'off',
		radix: 'off',
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': ['error'],
		'import/no-unassigned-import': [
			'error',
			{ allow: ['**/*.scss', 'core-js/**', 'regenerator-runtime/**', 'rc-calendar/assets/index.css'] },
		],
		'class-methods-use-this': 'off',
		'no-new-wrappers': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'no-return-assign': 'off',
		'no-nested-ternary': 'off',
		'no-console': ['warn', { allow: ['warn', 'error'] }],
		'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
		'react/prop-types': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'prefer-destructuring': 'off',
		'no-useless-constructor': 'off',
		'prettier/prettier': ['error'],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	overrides: [
		{
			files: ['*.tsx'],
			rules: {
				'@typescript-eslint/explicit-function-return-type': 0,
			},
		},
	],
};
