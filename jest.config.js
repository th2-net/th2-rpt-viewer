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

module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFiles: ['core-js'],
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
	testPathIgnorePatterns: [
		'<rootDir>/build',
		'<rootDir>/node_modules/',
		'<rootDir>/src/__tests__/util/',
		'<rootDir>/src/__tests__/setupTests.ts',
	],
	watchPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules/'],
	watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
	moduleNameMapper: {
		'\\.(css|less|scss)$': 'identity-obj-proxy',
		'^models(.*)$': '<rootDir>/src/models$1',
		"^helpers(.*)$": "<rootDir>/src/helpers$1",
		"^api(.*)$": "<rootDir>/src/api$1",
		"^stores(.*)$": "<rootDir>/src/stores$1",
		"^styles(.*)$": "<rootDir>/src/styles$1",
		"^components(.*)$": "<rootDir>/src/components$1",
		"^hooks(.*)$": "<rootDir>/src/hooks$1",
		"^modules(.*)$": "<rootDir>/src/modules$1",
	},
};
