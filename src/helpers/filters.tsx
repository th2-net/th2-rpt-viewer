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

import React from 'react';
import { observable, toJS } from 'mobx';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { FiltersHistoryType } from '../stores/FiltersHistoryStore';
import { areArraysEqual } from './array';
import { notEmpty } from './object';
import { getRangesIntersection, isInsideRange, isRangesIntersect, isValidRange } from './range';
import { FilterEntry } from '../stores/SearchStore';

export function getNonEmptyFilters(filter: Partial<FilterState>) {
	return Object.fromEntries(
		Object.entries(toJS(observable(filter)))
			.filter(([_, value]) => value && value.values && value.values.length > 0)
			.map(([k, v]) =>
				typeof v.values === 'string'
					? [k, v]
					: [
							k,
							{
								...v,
								values: [...new Set(v.values.sort())],
							},
					  ],
			),
	);
}

export function isEventsFilterHistory(
	filter: unknown,
): filter is FiltersHistoryType<EventFilterState> {
	return notEmpty(filter) && (filter as FiltersHistoryType<EventFilterState>).type === 'event';
}

export function isMessagesFilterHistory(
	filter: unknown,
): filter is FiltersHistoryType<MessageFilterState> {
	return notEmpty(filter) && (filter as FiltersHistoryType<MessageFilterState>).type === 'message';
}

export function isEmptyFilter(filter: Partial<EventFilterState>) {
	return !Object.values(filter)
		.filter(notEmpty)
		.some(filterValues => filterValues.values.length > 0);
}

export type BodyFilter = {
	type: Set<'filtered' | 'highlighted'>;
	range: [number, number];
};

export const isFiltersEqual = (first: BodyFilter, second: BodyFilter): boolean =>
	first?.range[0] === second.range[0] &&
	first?.range[1] === second.range[1] &&
	areArraysEqual([...(second?.type || [])], [...second.type]);

export const getFiltersIntersect = (first?: BodyFilter, second?: BodyFilter): BodyFilter[] => {
	if (!first || !second) throw new Error('One of ranges is undefined');

	if (!isRangesIntersect(first.range, second.range)) return [first, second];

	if (areArraysEqual([...first.type], [...second.type])) {
		return [
			{
				type: new Set([...first.type]),
				range: [
					Math.min(...[...first.range, ...second.range]),
					Math.max(...[...first.range, ...second.range]),
				],
			},
		];
	}

	const rangeIntersection: [number, number] = getRangesIntersection(first.range, second.range);
	const leftAddition: [number, number] = [
		Math.min(...[...first.range, ...second.range]),
		rangeIntersection[0] - 1,
	];
	const rightAddition: [number, number] = [
		rangeIntersection[1] + 1,
		Math.max(...[...first.range, ...second.range]),
	];

	return [
		...(isValidRange(leftAddition)
			? [
					{
						type: new Set([
							...(isInsideRange(leftAddition[1], first.range) ? first.type : []),
							...(isInsideRange(leftAddition[1], second.range) ? second.type : []),
						]),
						range: leftAddition,
					},
			  ]
			: []),
		{
			type: new Set([
				...(isInsideRange(rangeIntersection[0], first.range) ? first.type : []),
				...(isInsideRange(rangeIntersection[1], second.range) ? second.type : []),
			]),
			range: rangeIntersection,
		},
		...(isValidRange(rightAddition)
			? [
					{
						type: new Set([
							...(isInsideRange(rightAddition[1], first.range) ? first.type : []),
							...(isInsideRange(rightAddition[1], second.range) ? second.type : []),
						]),
						range: rightAddition,
					},
			  ]
			: []),
	];
};

export const uniteFilters = (_filters: BodyFilter[]): BodyFilter[] => {
	if (!_filters.length) return [];
	let filters: (BodyFilter | undefined)[] = _filters.slice();

	let tempRes: BodyFilter[] = [];
	const processedFilters = new Set<BodyFilter>();

	for (let i = 0; i < filters.length; i += tempRes.length ? 0 : 1) {
		tempRes = [];
		const firstFilter = filters[i];

		for (let j = i + 1; j < filters.length; j++) {
			const secondFilter = filters[j];
			if (firstFilter && secondFilter && isRangesIntersect(firstFilter.range, secondFilter.range)) {
				const filtersIntersects = getFiltersIntersect(firstFilter, secondFilter).filter(
					// eslint-disable-next-line no-loop-func
					filter =>
						isFiltersEqual(filter, secondFilter) ||
						![...processedFilters].some(f => isFiltersEqual(f, filter)),
				);

				processedFilters.add(secondFilter);
				filters[j] = undefined;
				tempRes.push(...filtersIntersects);
			}
		}
		if (tempRes.length && firstFilter) {
			processedFilters.add(firstFilter);
			filters[i] = undefined;
			filters = [...tempRes, ...filters.filter(Boolean)];
		}
	}

	return filters.filter(Boolean) as BodyFilter[];
};

export const wrapString = (
	string: string,
	fieldFilters: BodyFilter[],
	strRange: [number, number] = [0, string.length - 1],
): JSX.Element => {
	if (
		!string.length ||
		!fieldFilters.length ||
		!fieldFilters.some(filter => isRangesIntersect(filter.range, strRange))
	)
		return <>{string}</>;

	const filtersInRange = fieldFilters.filter(filter => isRangesIntersect(filter.range, strRange));

	const currentFilter = filtersInRange[0];
	const leftAddiction = string.substring(0, currentFilter.range[0] - strRange[0]);
	const rightAddiction = string.substring(
		strRange[1] - strRange[0] - (strRange[1] - currentFilter.range[1]) + 1,
	);
	const wrappedPart = string.substring(
		currentFilter.range[0] - strRange[0],
		strRange[1] - strRange[0] - (strRange[1] - currentFilter.range[1]) + 1,
	);

	return (
		<>
			{wrapString(leftAddiction, filtersInRange.slice(1), [
				strRange[0],
				strRange[0 + leftAddiction.length - 1],
			])}
			<span className={[...currentFilter.type].join(' ')}>{wrappedPart}</span>
			{wrapString(rightAddiction, filtersInRange.slice(1), [
				strRange[1] - rightAddiction.length + 1,
				strRange[1],
			])}
		</>
	);
};

export const getFiltersEntries = (
	string: string,
	filters?: string[],
	target?: FilterEntry,
): BodyFilter[] => {
	const res: Array<BodyFilter> = [];
	filters?.forEach(value => {
		let lastIndex = -1;

		do {
			lastIndex = string.indexOf(value, lastIndex !== -1 ? lastIndex + value.length : 0);

			if (lastIndex !== -1) {
				const entryRange: [number, number] = [lastIndex, lastIndex + value.length - 1];

				res.push({
					type: new Set([
						entryRange[0] === target?.range[0] && entryRange[1] === target?.range[1]
							? 'highlighted'
							: 'filtered',
					]),
					range: entryRange,
				});
			}
		} while (lastIndex !== -1);
	});

	return uniteFilters(res);
};
