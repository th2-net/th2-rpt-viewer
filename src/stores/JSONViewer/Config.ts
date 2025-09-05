/** ****************************************************************************
 * Copyright 2025 Exactpro (Exactpro Systems Limited)
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

interface Config {
	jsonlReaderTab?: {
		searchTokens?: [{ pattern: string; color: string }];
	};
}

async function loadConfig<T = unknown>(url: string): Promise<T | null> {
	const baseUrl = window.location.pathname.replace(/\/$/, '');
	const targetUrl = `${baseUrl}/${url}`;
	const response = await fetch(targetUrl);
	if (!response.ok) {
		console.error(`Failed to load config by url '${targetUrl}': ${response.statusText}`);
		return null;
	}
	return response.json() as T;
}

export const getCustomConfig = async () => loadConfig<Config>('/config/th2/custom.json');
