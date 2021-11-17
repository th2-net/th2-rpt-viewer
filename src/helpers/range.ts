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

export const isValidRange = (range: [number, number]): boolean => {
	return range[0] >= 0 && range[1] >= 0 && range[1] >= range[0];
};

export const isRangesIntersect = (first?: [number, number], second?: [number, number]): boolean => {
	if (!first || !second) throw new Error('One of ranges is undefined');

	const min = first[0] < second[0] ? first : second;
	const max = min[0] === first[0] && min[1] === first[1] ? second : first;

	return min[1] >= max[0];
};

export const getRangesIntersection = (
	first?: [number, number],
	second?: [number, number],
): [number, number] => {
	if (!first || !second) throw new Error('One of ranges is undefined');

	const min = first[0] < second[0] ? first : second;
	const max = min[0] === first[0] && min[1] === first[1] ? second : first;

	if (min[1] < max[0]) throw new Error("Ranges haven't an intersection");

	return [max[0], min[1] < max[1] ? min[1] : max[1]];
};

export const trimRange = (range: [number, number], limits: [number, number]): [number, number] => {
	return [Math.max(range[0], limits[0]), Math.min(range[1], limits[1])];
};

export const isInsideRange = (point: number, range: [number, number]) => {
	return range[0] <= point && range[1] >= point;
};
