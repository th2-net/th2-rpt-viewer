/******************************************************************************
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
 ******************************************************************************/

const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { appSrc } = require('./paths');

module.exports = merge(commonConfig, {
	mode: 'development',
	output: {
		publicPath: '/',
	},
	mode: 'development',
	entry: './src/index.tsx',
	devtool: 'inline-source-map',
	devServer: {
		// watchOptions: {
		// 	poll: true,
		// 	ignored: [/node_modules/, 'src/__tests__/'],
		// },
		compress: true,
		port: 9001,
		host: '0.0.0.0',
		historyApiFallback: true,
		proxy: {
			'/': {
				target: 'http://th2-qa:30000/schema-schema-qa/',
				changeOrigin: true,
				secure: false,
			},
		},
		hot: true,
	},
	module: {
		rules: [
			{
				test: /\.[jt]sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve('babel-loader'),
						options: {
							plugins: [require.resolve('react-refresh/babel')].filter(Boolean),
						},
					},
				],
			},
			// {
			//     test: /\.(ts|tsx)$/,
			//     enforce: 'pre',
			//     use: [{
			//         options: {
			//             eslintPath: require.resolve('eslint'),
			//             failOnError: false,
			//             cache: false,
			//             quite: true,
			//             formatter: require('eslint-formatter-pretty'),
			//         },
			//         loader: require.resolve('eslint-loader'),
			//     }],
			//     exclude: /node_modules/,
			// },
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				use: ['style-loader', 'css-loader', 'sass-loader'].filter(loader => loader),
			},
		],
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin({
			typescript: {
				enabled: true,
				diagnosticOptions: {
					semantic: true,
					syntactic: true,
				},
				mode: 'write-references',
			},
			eslint: {
				enabled: true,
				files: './src/**/*.{ts,tsx,js,jsx}',
				options: {
					formatter: require('eslint-formatter-pretty'),
					loader: 'eslint-loader',
				},
			},
			formatter: 'codeframe',
		}),
		new webpack.HotModuleReplacementPlugin(),
		new ReactRefreshWebpackPlugin(),
	],
});
