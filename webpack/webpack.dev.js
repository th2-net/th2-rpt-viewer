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
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const commonConfig = require('./webpack.common');
const { appSrc } = require('./paths');

module.exports = merge(commonConfig, {
	output: {
		publicPath: '/',
	},
	mode: 'development',
	entry: [appSrc],
	devtool: 'inline-source-map',
	devServer: {
		watchFiles: {
			options: {
				usePolling: true,
				ignored: ['src/__tests__/', '**/node_modules'],
			},
		},
		client: {
			overlay: false,
		},
		compress: true,
		port: 9001,
		host: '0.0.0.0',
		historyApiFallback: true,
		proxy: {
			'/': {
				target: 'http://de-th2-qa:30000/th2-groups/',
				changeOrigin: true,
				secure: false,
			},
		},
		hot: true,
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				use: ['style-loader', 'css-loader', 'sass-loader'].filter(loader => loader),
			},
		],
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin({ devServer: false }),
		new ReactRefreshWebpackPlugin({ overlay: false }),
	],
});
