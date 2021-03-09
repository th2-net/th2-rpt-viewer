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

export function createURLSearchParams(
	_params: Record<string, string | number | boolean | null | string[] | undefined>,
) {
	const params = new URLSearchParams();

	for (const [key, param] of Object.entries(_params)) {
		// eslint-disable-next-line no-continue
		if (param == null || param === '') continue;
		if (Array.isArray(param)) {
			param.forEach(p => params.append(key, p));
		} else {
			params.set(key, param.toString());
		}
	}

	return params;
}
