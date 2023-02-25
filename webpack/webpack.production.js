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

const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const path = require('path');
const packageJSON = require('../package.json');

const { appBuild, appPath, appSrc } = require('./paths');

module.exports = merge(commonConfig, {
	output: {
		path: path.resolve(appBuild, 'out'),
		publicPath: '',
		filename: '[name].[contenthash].js',
		chunkFilename: '[name].[contenthash].js',
	},
	mode: 'production',
	entry: path.resolve(appSrc, 'index.tsx'),
	module: {
		rules: [
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				use: [
					'style-loader',
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.resolve(appPath, 'postcss.config.js'),
							},
						}
					},
					'sass-loader',
				].filter(loader => loader),
			},
		],
	},
	optimization: {
		usedExports: true,
	},
	plugins: [
		new WebpackManifestPlugin({
			generate: (seed, files, entries) => {
				return {
					version: packageJSON.version,
				};
			},
		}),
	],
});
