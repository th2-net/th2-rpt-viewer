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
	presets: [
		['@babel/env', { targets: '> 0.25%', modules: false }],
		'@babel/preset-typescript',
		[
			'@babel/preset-react',
			{
				runtime: 'automatic',
			},
		],
	],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		['@babel/proposal-class-properties', { legacy: true }],
		'react-hot-loader/babel',
		[
			'const-enum',
			{
				transform: 'constObject',
			},
		],
		'@babel/plugin-proposal-numeric-separator',
		'@babel/plugin-proposal-nullish-coalescing-operator',
		'@babel/plugin-proposal-optional-chaining',
		'@babel/plugin-proposal-optional-catch-binding',
	],
	env: {
		production: {
			presets: ['minify'],
			plugins: ['react-remove-properties', { properties: ['data-testid'] }],
		},
		test: {
			presets: ['@babel/preset-env', '@babel/preset-react'],
		},
	},
};
