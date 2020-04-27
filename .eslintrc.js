/*******************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
 ******************************************************************************/

module.exports = {
  	parser: '@typescript-eslint/parser',
  	extends: [
		'airbnb-base',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
	  ],
	plugins: [
		'react-hooks'
	],
	env: {
		browser: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures:  {
			jsx:  true,
		},
	},
	rules: {
		'import/no-unresolved': 2,
		'import/named': 2,
		'import/default': 2,
		'import/first': 2,
		'import/no-duplicates': 2,
		'import/newline-after-import': 2,
		'import/no-unassigned-import': 2,
		'import/extensions': 0,
		'import/prefer-default-export': 0,
		'import/no-cycle': 0,
		'no-tabs': 0,
		'indent': ['error', 'tab'],
		'max-len': [2, 120, 4],
		'semi': 0,
		'@typescript-eslint/semi': ['error'],
		'@typescript-eslint/member-delimiter-style': ['error', {
			multiline: {
			  delimiter: 'semi',
			  requireLast: true,
			},
			singleline: {
			  delimiter: 'semi',
			  requireLast: false,
			},
		  }
		],
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/explicit-function-return-type': 0,
		'implicit-arrow-linebreak': 0,
		'arrow-parens': ['error', 'as-needed'],
		'no-plusplus': 0,
		'radix': 0,
		"no-unused-expressions": 0,
		"@typescript-eslint/no-unused-expressions": ["error"],
		'import/no-unassigned-import': [2, { "allow": ["**/*.scss"] }],
		'class-methods-use-this': 0,
		'no-new-wrappers': 0,
		'no-mixed-spaces-and-tabs': 0
	},
	settings: {
		react: {
			version: 'detect'
		}
	},
	overrides: [
		{
			files: ['*.tsx'],
			rules: {
			  '@typescript-eslint/explicit-function-return-type': 0,
			},
		  },
	]
};
