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

/* eslint-disable no-new-wrappers */
// eslint-disable-next-line import/no-unassigned-import
import 'setimmediate';

/**
 * Returns next item after current index in array if it exists, or returns
 * first item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function nextCyclicItemByIndex<T>(array: Array<T>, index: number): T {
	if (index < 0) {
		return array[0];
	}

	return array[(index + 1) % array.length];
}

/**
 * Returns previous item before current index in array if it exists
 * or returns last item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function prevCyclicItemByIndex<T>(array: Array<T>, index: number): T {
	if (index < 0) {
		return array[array.length - 1];
	}

	return array[(array.length + index - 1) % array.length];
}

/**
 * Returns next item after current in array if it exists, or retruns first item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function nextCyclicItem<T>(array: Array<T>, item: T): T | null {
	const currentIndex = array.indexOf(item);

	if (currentIndex === -1) {
		return null;
	}

	return nextCyclicItemByIndex(array, currentIndex);
}

/**
 * Returns previous item before current in array if it exists
 * or returns last item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function prevCyclicItem<T>(array: Array<T>, item: T): T | null {
	const currentIndex = array.indexOf(item);

	if (currentIndex === -1) {
		return null;
	}

	return prevCyclicItemByIndex(array, currentIndex);
}

/**
 * Returns next item after current item in array if it exists
 * or returns first item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function findNextCyclicItem<T>(
	array: Array<T>,
	predicateFn: (item: T) => boolean,
): T | null {
	const item = array.find(predicateFn)!;

	return nextCyclicItem(array, item);
}

/**
 * Returns previous item before current item in array if it exists
 * or returns last item if it doesn't exist.
 * @param array Target array
 * @param item Current item
 */
export function findPrevCyclicItem<T>(
	array: Array<T>,
	predicateFn: (item: T) => boolean,
): T | null {
	const item = array.find(predicateFn)!;

	return prevCyclicItem(array, item);
}

/**
 * Returns scrolled id for selected items.
 * @param array selected items ids
 * @param prevScrolledId previous scrolled item id
 */
export function getScrolledId(array: Array<number>, prevScrolledId: number): Number {
	if (array.includes(prevScrolledId)) {
		return new Number(nextCyclicItem(array, prevScrolledId));
	}

	return new Number(array[0]);
}

export function replaceByIndex<T>(arr: T[], targetIndex: number, targetItem: T): T[] {
	return arr.map((item, index) => (index === targetIndex ? targetItem : item));
}

export function removeByIndex<T>(arr: T[], targetIndex: number): T[] {
	return arr.filter((_, index) => index !== targetIndex);
}

export function intersection<T>(arr1: T[], arr2: T[]): T[] {
	return arr1.filter(item => arr2.includes(item));
}

export function complement<T>(arr1: T[], arr2: T[]): T[] {
	return arr1.filter(item => !arr2.includes(item));
}

export function move<T>(arr: T[], from: number, to: number) {
	const clone = [...arr];
	Array.prototype.splice.call(clone, to, 0, Array.prototype.splice.call(clone, from, 1)[0]);
	return clone;
}

export function sliceToChunks<T>(arr: T[], chunkSize: number): T[][] {
	const chunks = [];

	for (let i = 0; i < arr.length; i += chunkSize) {
		chunks.push(arr.slice(i, i + chunkSize));
	}

	return chunks;
}

export function areArraysEqual<T extends unknown[]>(arr1: T, arr2: T): boolean {
	if (arr1 === arr2) {
		return true;
	}

	if (!arr1 || !arr2) {
		return false;
	}

	if (arr1.length !== arr2.length) {
		return false;
	}

	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
}

export function getArrayOfUniques<T>(arr: T[]) {
	return [...new Set(arr)];
}

/**
 * This function is used to safely get the element from array
 * Helps to avoid mobx warnings
 * @param arr array to get element from
 * @param index index of element
 */
export function getItemAt<T>(arr: T[], index: number): T | null {
	return index < arr.length && index >= 0 ? arr[index] : null;
}

export const getFirst = <T>(arr: T[]) => getItemAt(arr, 0) as T;

export const getLast = <T>(arr: T[]) => getItemAt(arr, arr.length - 1) as T;
