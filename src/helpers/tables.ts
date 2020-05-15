/** ****************************************************************************
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
 ***************************************************************************** */

import ActionParameter from '../models/ActionParameter';

export const extractParams = (fields: any): ActionParameter[] => {
	if (!fields) return [];
	return Object.keys(fields)
		.reduce((params, key) => {
			if (typeof fields[key] === 'string') {
				return [...params, createParam(key, fields[key], [])];
			}
			if (Array.isArray(fields[key])) {
				return [
					...params,
					...fields[key].map((fieldObj: any) =>
						createParam(
							key,
							Object.keys(fields[key]).length.toString(),
							extractParams(fieldObj),
						)),
				];
			}
			if (fields[key] === Object(fields[key])) {
				return [
					...params,
					createParam(
						key,
						Object.keys(fields[key]).length.toString(),
						extractParams(fields[key]),
					),
				];
			}
			return params;
		}, [] as ActionParameter[]);
};

const createParam = (
	name: string,
	value: string | undefined,
	subParameters: ActionParameter[],
): ActionParameter => ({
	name,
	value,
	subParameters,
});
