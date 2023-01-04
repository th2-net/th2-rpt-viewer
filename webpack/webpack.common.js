/** ****************************************************************************
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

const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const { appSrc, appPath } = require('./paths');

module.exports = {
	resolve: {
		extensions: ['.ts', '.tsx', '.scss', '.js'],
		alias: {
			helpers: path.resolve(appSrc, 'helpers'),
			models: path.resolve(appSrc, 'models'),
			api: path.resolve(appSrc, 'api'),
			stores: path.resolve(appSrc, 'stores'),
			styles: path.resolve(appSrc, 'styles'),
			components: path.resolve(appSrc, 'components'),
			hooks: path.resolve(appSrc, 'hooks'),
			modules: path.resolve(appSrc, 'modules'),
		},
	},
	module: {
		rules: [
			{
				test: /\.worker\.ts$/,
				use: { loader: 'worker-loader' },
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(ts|tsx)$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebPackPlugin({
			title: 'Report viewer',
			template: path.resolve(appSrc, 'index.html'),
			favicon: path.resolve(appPath, 'resources', 'icons', 'favicon.svg'),
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /^\.\/locale$/,
			contextRegExp: /moment$/,
		}),
		new webpack.EnvironmentPlugin({
			BASE_URL: 'backend',
		}),
	],
};
