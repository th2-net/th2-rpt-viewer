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

/**
 * Returns typed object keys
 * @param obj
 */
export function getObjectKeys<O extends object>(obj: O) {
	return Object.keys(obj) as Array<keyof O>;
}

export function notEmpty<TValue>(value: TValue | null | undefined | string): value is TValue {
	return value !== null && value !== undefined && value !== '';
}
