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
/* eslint-disable react/display-name */

import React from 'react';
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { getItemName, isEventAction, isEventMessage } from '../../helpers/event';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useMessageBodySortStore } from '../../hooks';
import { ActionType, EventAction } from '../../models/EventAction';
import {
	EventBodyPayloadType,
	TablePayload,
	TreeTablePayload,
	VerificationPayload,
	VerificationPayloadField,
} from '../../models/EventActionPayload';
import { EventMessage } from '../../models/EventMessage';
import { SearchResult } from '../../stores/SearchStore';
import { EventFilterState, MessageFilterState } from './SearchPanelFilters';

const DETAIL_VALUE_LENGTH_LIMIT = 40;

const trimValue = (value: string) => value.slice(0, DETAIL_VALUE_LENGTH_LIMIT);

const getSortedEntries = (
	string: string,
	filters: string[],
): Array<{
	value: string;
	range: [number, number];
}> => {
	const entries: Array<{
		value: string;
		range: [number, number];
	}> = [];

	filters.forEach(value => {
		let lastIndex = -1;

		do {
			lastIndex = string.indexOf(value, lastIndex !== -1 ? lastIndex + value.length : 0);
			if (lastIndex !== -1) {
				entries.push({
					value,
					range: [lastIndex, lastIndex + value.length - 1],
				});
			}
		} while (lastIndex !== -1);
	});

	return entries.sort(
		({ range: firstRange }, { range: secondRange }) => firstRange[0] - secondRange[0],
	);
};

type SearchResultItemProps = {
	result: SearchResult;
	filters: EventFilterState | MessageFilterState;
	onResultClick: (
		item: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; range: [number, number] },
	) => void;
};

type ResultActionType = Exclude<ActionType, ActionType.EVENT_TREE_NODE>;

type ItemByActionType<T extends ResultActionType> = {
	event: EventAction;
	message: EventMessage;
}[T];

const SearchResultItem = ({ result, filters, onResultClick }: SearchResultItemProps) => {
	const { getSortedFields } = useMessageBodySortStore();

	const keysToDisplay: {
		[key in ResultActionType]: {
			[k in keyof ItemByActionType<key>]?: (value: ItemByActionType<key>[k]) => JSX.Element;
		};
	} = {
		event: {
			parentEventId: parentId => <>{parentId || 'null'}</>,
			attachedMessageIds: ids => (
				<>
					[
					{ids
						.filter(id =>
							(filters as EventFilterState).attachedMessageId.values.some(filterId =>
								id.includes(filterId),
							),
						)
						.join(', ')}
					]
				</>
			),
			body: body => {
				if (!body) return <>{null}</>;

				const treeTableEntries = (bodyPart: TablePayload | TreeTablePayload): string[] => {
					if (!bodyPart.rows) return [];

					return Object.entries(bodyPart.rows)
						.map(rowEntry => {
							if (rowEntry[1].type === 'row') {
								return [
									rowEntry[0],
									...(Object.values(rowEntry[1].columns) as (string | boolean)[]).map(v =>
										v.toString(),
									),
								];
							}
							return [...treeTableEntries(rowEntry[1])];
						})
						.flat();
				};

				const verificationEntries = (
					bodyPart: VerificationPayload | VerificationPayloadField,
				): string[] => {
					if (!bodyPart.fields) return [];

					return Object.entries(bodyPart.fields)
						.map(rowPart => {
							if (rowPart[1].fields) return verificationEntries(rowPart[1]);

							return [
								rowPart[0],
								...(Object.values(rowPart[1]) as (string | boolean)[]).map(v => v.toString()),
							];
						})
						.flat();
				};

				const bodyAsString = JSON.stringify(body).replace(
					/:[{|[]/gm,
					(str: string) => `${str[0]} ${str[1]}`,
				);

				if (!filters.body.values.length || filters.body.negative)
					return <>{trimValue(bodyAsString)}</>;

				const values = [
					...new Set(
						body
							.map(bodyPart => {
								switch (bodyPart.type) {
									case EventBodyPayloadType.MESSAGE:
										return [bodyPart.data];
									case EventBodyPayloadType.TABLE: {
										if (!bodyPart.rows) return [];

										return bodyPart.rows.flatMap(row => Object.values(row));
									}
									case EventBodyPayloadType.TREE_TABLE:
										return treeTableEntries(bodyPart);
									case EventBodyPayloadType.VERIFICATION:
										return verificationEntries(bodyPart);
									default:
										return [];
								}
							})
							.flat(),
					),
				];

				const sortedEntries = getSortedEntries(bodyAsString, filters.body.values);

				return (
					<>
						{sortedEntries.flat().map(({ value }, idx, arr) => {
							const clickable = values.some(v => v.includes(value));
							return (
								<React.Fragment key={`${value}-${idx}`}>
									<span
										className={clickable ? 'filtered' : undefined}
										onClick={() => {
											if (clickable) {
												onResultClick(result);
												// onFilterClick(range, 'body');
											}
										}}>
										{value}
									</span>
									{arr.length !== idx + 1 ? ', ' : ''}
								</React.Fragment>
							);
						})}
					</>
				);
			},
		},
		message: {
			messageType: messageType => {
				if (!filters.type.values.length || filters.type.negative) return <>{messageType}</>;

				return (
					<>
						{filters.type.values
							.filter(filterValue => messageType.includes(filterValue))
							.join(', ')}
					</>
				);
			},
			body: body => {
				if (!body) return <>{null}</>;

				const { fields, ...bodyWithoutFields } = body;

				const sortedObject = {
					...body,
					fields: Object.fromEntries(getSortedFields(body.fields)),
				};

				const bodyAsString = JSON.stringify(sortedObject).replace(
					/:[{|[|"]/gm,
					(str: string) => `${str[0]} ${str[1]}`,
				);

				if (!filters.body.values.length || filters.body.negative)
					return <>{trimValue(bodyAsString)}</>;

				const sortedEntries = getSortedEntries(bodyAsString, filters.body.values);

				const offset =
					JSON.stringify(bodyWithoutFields).replace(
						/:[{|[|"]/gm,
						(str: string) => `${str[0]} ${str[1]}`,
					).length +
					',"fields": '.length -
					1;

				return (
					<>
						{sortedEntries.flat().map(({ value, range }, idx, arr) => (
							<React.Fragment key={`${value}-${idx}`}>
								<span
									className='filtered'
									onClick={() => {
										onResultClick(result, {
											range: [range[0] - offset, range[1] - offset],
											type: 'body',
										});
									}}>
									{value}
								</span>
								{arr.length !== idx + 1 ? ', ' : ''}
							</React.Fragment>
						))}
					</>
				);
			},
			bodyBase64: binary => {
				if (!binary) return <>null</>;

				const bodyBinary = (filters as MessageFilterState).bodyBinary;
				if (!bodyBinary.values.length || bodyBinary.negative) return <>{trimValue(binary)}</>;

				const sortedEntries = getSortedEntries(window.atob(binary), bodyBinary.values);

				return (
					<>
						{sortedEntries.flat().map(({ value, range }, idx, arr) => (
							<React.Fragment key={`${value}-${idx}`}>
								<span
									className='filtered'
									onClick={() => {
										onResultClick(result, {
											range: [range[0], range[1]],
											type: 'bodyBinary',
										});
									}}>
									{value}
								</span>
								{arr.length !== idx + 1 ? ', ' : ''}
							</React.Fragment>
						))}
					</>
				);
			},
		},
	};

	const nameClassName = createBemElement(
		'search-result',
		'name',
		result.type,
		isEventAction(result) ? (result.successful ? 'success' : 'fail') : null,
	);

	const iconClassName = createStyleSelector(
		'search-result__icon',
		`${result.type}-icon`,
		isEventMessage(result) ? null : result.successful ? 'passed' : 'failed',
	);

	return (
		<div className='search-result'>
			<i className={iconClassName} />
			<div className={nameClassName} onClick={() => onResultClick(result)}>
				{getItemName(result)}
			</div>
			<div className='search-result__timestamp'>{formatTime(getTimestampAsNumber(result))}</div>
			<div className='search-result__body'>
				{Object.entries(keysToDisplay[result.type]).map(([key, valueGetter], index, arr) => (
					<React.Fragment key={key}>
						<span className={createBemElement('search-result', 'body-key')}>{`"${key}": `}</span>
						{valueGetter(result[key as keyof SearchResult])}
						{arr.length !== index + 1 ? ', ' : ''}
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

export default SearchResultItem;
