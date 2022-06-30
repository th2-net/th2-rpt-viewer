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
import { isRangesIntersect, trimRange } from '../../../helpers/range';
import { useMessageBodySortStore, useMessagesStore } from '../../../hooks';
import { BodyFilter, getFiltersEntries, wrapString } from '../../../helpers/filters';

const BEAUTIFIED_PAD_VALUE = 15;
const DEFAULT_HIGHLIGHT_COLOR = '#e2dfdf';
const SELECTED_HIGHLIGHT_COLOR = '#fff';

interface Props {
	isBeautified: boolean;
	body: MessageBody | null;
	isSelected: boolean;
	applyFilterToBody?: boolean;
	sortOrderItems: string[];
}

function MessageBodyCard({ isBeautified, body, isSelected, applyFilterToBody }: Props) {
	const { currentSearch } = useSearchStore();
	const { selectedBodyFilter } = useMessagesStore();
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

		return getFiltersEntries(
			bodyAsString,
			currentSearch?.request.filters.body.values,
			selectedBodyFilter || undefined,
		);
	}, [currentSearch?.request.filters]);

	if (body == null) {
		return <pre className='mc-body__human'>null</pre>;
	}

	return (
		<pre className='mc-body__human'>
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
										? wrapString(`"${key}": `, trimedFilters, keyRange)
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

		return applyFilterToBody ? wrapString(fieldValue, trimedFilters, range) : <>{`"${field}"`}</>;
	}

	return (
		<span className='mc-body__field-simple-value'>
			{applyFilterToBody ? wrapString(`"${field}"`, trimedFilters, range) : `"${field}"`}
		</span>
	);
}
