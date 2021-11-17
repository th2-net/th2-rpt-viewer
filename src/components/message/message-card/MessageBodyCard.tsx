/** *****************************************************************************
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { createBemElement } from '../../../helpers/styleCreators';
import MessageBody, { isListValue, isMessageValue } from '../../../models/MessageBody';
import { useSearchStore } from '../../../hooks/useSearchStore';
import {
	getRangesIntersection,
	isInsideRange,
	isRangesIntersect,
	isValidRange,
	trimRange,
} from '../../../helpers/range';
import { useMessageBodySortStore } from '../../../hooks';
import { areArraysEqual } from '../../../helpers/array';

const BEAUTIFIED_PAD_VALUE = 15;
const DEFAULT_HIGHLIGHT_COLOR = '#e2dfdf';
const SELECTED_HIGHLIGHT_COLOR = '#fff';

interface Props {
	isBeautified: boolean;
	body: MessageBody | null;
	isSelected: boolean;
	renderInfo: () => React.ReactNode;
	applyFilterToBody?: boolean;
}

type BodyFilter = {
	type: Set<'filtered' | 'highlighted'>;
	range: [number, number];
};

const isFiltersEqual = (first: BodyFilter, second: BodyFilter): boolean => {
	return (
		first?.range[0] === second.range[0] &&
		first?.range[1] === second.range[1] &&
		areArraysEqual([...(second?.type || [])], [...second.type])
	);
};

const getFiltersIntersect = (first?: BodyFilter, second?: BodyFilter): BodyFilter[] => {
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

const uniteFilters = (_filters: BodyFilter[]): BodyFilter[] => {
	if (!_filters.length) return [];
	let filters: (BodyFilter | undefined)[] = _filters.slice();

	let tempRes: BodyFilter[] = [];
	for (let i = 0; i < filters.length; i += tempRes.length ? 0 : 1) {
		tempRes = [];

		for (let j = i + 1; j < filters.length; j++) {
			if (isRangesIntersect(filters[i]?.range, filters[j]?.range)) {
				const filtersIntersects = getFiltersIntersect(filters[i], filters[j]).filter(
					// eslint-disable-next-line no-loop-func
					filter => {
						const processedFilter = filters[j];
						return (
							(processedFilter && isFiltersEqual(filter, processedFilter)) ||
							(!filters.find(f => (f ? isFiltersEqual(f, filter) : false)) &&
								!tempRes.find(f => isFiltersEqual(f, filter)))
						);
					},
				);

				filters[j] = undefined;
				tempRes.push(...filtersIntersects);
			}
		}
		if (tempRes.length) {
			filters[i] = undefined;
			filters = [...tempRes, ...filters.filter(Boolean)];
		}
	}

	return filters.filter(Boolean) as BodyFilter[];
};

function MessageBodyCard({ isBeautified, body, isSelected, renderInfo, applyFilterToBody }: Props) {
	const { currentSearch, selectedBodyFilterRange } = useSearchStore();
	const { getSortedFields, sortOrderItems } = useMessageBodySortStore();

	const sortedObject = React.useMemo(
		() => Object.fromEntries(getSortedFields(body?.fields ? body.fields : {})),
		[body, [sortOrderItems]],
	);

	const bodyAsString = JSON.stringify(sortedObject).replace(
		/:[{|[|"]/gm,
		(str: string) => `${str[0]} ${str[1]}`,
	);

	const filterEntries: Array<BodyFilter> = React.useMemo(() => {
		if (!applyFilterToBody) return [];

		const res: Array<BodyFilter> = [];
		currentSearch?.request.filters.body.values.forEach(value => {
			let lastIndex = 0;

			while (lastIndex !== -1) {
				lastIndex = bodyAsString.indexOf(value, lastIndex ? lastIndex + value.length : 0);

				if (lastIndex !== -1) {
					const entryRange: [number, number] = [lastIndex, lastIndex + value.length - 1];

					res.push({
						type: new Set([
							entryRange[0] === selectedBodyFilterRange?.[0] &&
							entryRange[1] === selectedBodyFilterRange?.[1]
								? 'highlighted'
								: 'filtered',
						]),
						range: entryRange,
					});
				}
			}
		});
		return uniteFilters(res);
	}, [currentSearch?.request.filters]);

	if (body == null) {
		return <pre className='mc-body__human'>null</pre>;
	}

	return (
		<pre className='mc-body__human'>
			{renderInfo && renderInfo()}
			<MessageBodyCardField
				field={sortedObject}
				range={[0, bodyAsString.length - 1]}
				primarySort={sortOrderItems}
				highlightColor={isSelected ? SELECTED_HIGHLIGHT_COLOR : DEFAULT_HIGHLIGHT_COLOR}
				isBeautified={isBeautified}
				applyFilterToBody={applyFilterToBody}
				filters={filterEntries}
			/>
		</pre>
	);
}

export default observer(MessageBodyCard);

export function MessageBodyCardFallback({ body, isBeautified }: Props) {
	return (
		<pre className='mc-body__human'>
			{isBeautified ? JSON.stringify(body, undefined, '  ') : JSON.stringify(body)}
		</pre>
	);
}

type FieldProps = {
	field: Object | Array<number | string> | number | string | null;
	range: [number, number];
	filters: BodyFilter[];
	isBeautified: boolean;
	highlightColor: string;
	primarySort: string[];
	applyFilterToBody?: boolean;
};

function MessageBodyCardField(props: FieldProps) {
	const { field, range, applyFilterToBody, filters, isBeautified } = props;

	const [isSameContext, highlightSameContext] = React.useState(false);

	const wrapField = (
		fieldStr: string,
		strRange: [number, number],
		fieldFilters: BodyFilter[],
	): JSX.Element => {
		if (
			!fieldStr.length ||
			!fieldFilters.length ||
			!fieldFilters.some(filter => isRangesIntersect(filter.range, strRange))
		)
			return <>{fieldStr}</>;

		const filtersInRange = fieldFilters.filter(filter => isRangesIntersect(filter.range, strRange));

		const currentFilter = filtersInRange[0];
		const leftAddiction = fieldStr.substring(0, currentFilter.range[0] - strRange[0]);
		const rightAddiction = fieldStr.substring(
			strRange[1] - strRange[0] - (strRange[1] - currentFilter.range[1]) + 1,
		);
		const wrappedPart = fieldStr.substring(
			currentFilter.range[0] - strRange[0],
			strRange[1] - strRange[0] - (strRange[1] - currentFilter.range[1]) + 1,
		);

		return (
			<>
				{wrapField(
					leftAddiction,
					[strRange[0], strRange[0 + leftAddiction.length - 1]],
					filtersInRange.slice(1),
				)}
				<span className={[...currentFilter.type].join(' ')}>{wrappedPart}</span>
				{wrapField(
					rightAddiction,
					[strRange[1] - rightAddiction.length + 1, strRange[1]],
					filtersInRange.slice(1),
				)}
			</>
		);
	};

	const trimedFilters = filters.map(filter => ({
		...filter,
		range: trimRange(filter.range, range),
	}));

	if (isMessageValue(field)) {
		const fieldRanges: [number, number][] = [];

		return (
			<>
				<span
					className={createBemElement(
						'mc-body',
						'field-border',
						isSameContext ? 'active' : null,
						applyFilterToBody &&
							trimedFilters.some(part => isRangesIntersect(part.range, [range[0], range[0]]))
							? 'filtered'
							: null,
					)}>
					{'{'}
				</span>
				<span
					className='mc-body__field'
					style={{
						display: isBeautified ? 'block' : undefined,
						paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined,
					}}>
					{Object.entries(field).map(([key, value], idx, arr) => {
						const [from] = range;
						const fieldBody = JSON.stringify(value).replace(
							/:[{|[|"]/gm,
							(str: string) => `${str[0]} ${str[1]}`,
						);
						const fieldLength = fieldBody.length;
						const newFrom =
							(!fieldRanges.length
								? from + '{'.length
								: fieldRanges[fieldRanges.length - 1][1] + ','.length + 1) + `"${key}": `.length;
						const fieldRange: [number, number] = [newFrom, newFrom + fieldLength - 1];
						const fieldFilters = filters.filter(({ range: filterRange }) =>
							isRangesIntersect(fieldRange, filterRange),
						);
						fieldRanges.push(fieldRange);
						const keyRange: [number, number] = [
							fieldRange[0] - `"${key}": `.length,
							fieldRange[0] - 1,
						];

						return (
							<React.Fragment key={key}>
								<span
									onMouseEnter={() => highlightSameContext(true)}
									onMouseLeave={() => highlightSameContext(false)}
									className='mc-body__field-label'>
									{applyFilterToBody
										? wrapField(`"${key}": `, keyRange, trimedFilters)
										: `"${key}": `}
								</span>
								<MessageBodyCardField
									key={key}
									{...props}
									field={value}
									range={fieldRange}
									filters={fieldFilters}
								/>
								{!isBeautified && arr.length !== idx + 1 ? ',' : ''}
							</React.Fragment>
						);
					})}
				</span>
				<span
					className={createBemElement(
						'mc-body',
						'field-border',
						isSameContext ? 'active' : null,
						applyFilterToBody &&
							trimedFilters.some(part => isRangesIntersect(part.range, [range[1], range[1]]))
							? 'filtered'
							: null,
					)}
					style={{ display: isBeautified ? 'block' : undefined }}>
					{'}'}
				</span>
			</>
		);
	}
	if (isListValue(field)) {
		const fieldValue = `[${field
			.map((value, idx, arr) => `${value}${arr.length !== idx + 1 ? ',' : ''}`)
			.join('')}]`;

		return applyFilterToBody ? wrapField(fieldValue, range, trimedFilters) : <>{`"${field}"`}</>;
	}

	return (
		<span className='mc-body__field-simple-value'>
			{applyFilterToBody ? wrapField(`"${field}"`, range, trimedFilters) : `"${field}"`}
		</span>
	);
}
