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
import { getItemName, isEventAction, isEventMessage, isEventNode } from '../../helpers/event';
import { createBemBlock, createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useMessageBodySortStore } from '../../hooks';
import { ActionType, EventAction } from '../../models/EventAction';
import {
	EventBodyPayloadType,
	TablePayload,
	TreeTableCollection,
	TreeTablePayload,
	TreeTableRow,
	VerificationPayload,
	VerificationPayloadField,
} from '../../models/EventActionPayload';
import { EventMessage } from '../../models/EventMessage';
import { FilterEntry, SearchResult } from '../../stores/SearchStore';
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
	highlighted?: boolean;
	filters: EventFilterState | MessageFilterState;
	onResultClick: (
		item: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; entry: FilterEntry },
	) => void;
};

type ResultActionType = Exclude<ActionType, ActionType.EVENT_TREE_NODE>;

type ItemByActionType<T extends ResultActionType> = {
	event: EventAction;
	message: EventMessage;
}[T];

const SearchResultItem = ({
	result,
	highlighted,
	filters,
	onResultClick,
}: SearchResultItemProps) => {
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

				const tableEntries = (
					bodyPayload: TablePayload,
					path: string[],
				): {
					path: string[];
					value: string;
				}[] =>
					bodyPayload.rows.flatMap((row, idx) =>
						Object.entries(row).map(([key, value]) => ({
							path: [...path, idx.toString(), key],
							value,
						})),
					);

				const treeTableEntries = (
					bodyPayload: TreeTablePayload,
					path: string[],
				): {
					path: string[];
					value: string;
				}[] => {
					if (!bodyPayload.rows) return [];

					const extractValue = (
						bodyPart: TreeTableRow | TreeTableCollection,
						pathToValue: string[],
					): {
						path: string[];
						value: string;
					}[] => {
						if (bodyPart.type === 'collection')
							return Object.entries(bodyPart.rows).flatMap(([key, value], index) => {
								const newPath = [...pathToValue, index.toString()];
								return [{ path: newPath, value: key }, ...extractValue(value, newPath)];
							});

						return Object.entries(bodyPart.columns).map(([, value], index) => ({
							path: [...pathToValue, index.toString()],
							value: value.toString(),
						}));
					};

					const res = Object.entries(bodyPayload.rows).flatMap(([key, value], index) => {
						const newPath = [...path, index.toString()];
						return [{ path: newPath, value: key }, ...extractValue(value, newPath)];
					});
					return res;
				};

				const verificationEntries = (
					bodyPart: VerificationPayload,
					path: string[],
				): {
					path: string[];
					value: string;
				}[] => {
					if (!bodyPart.fields) return [];

					const extractValue = (
						field: VerificationPayloadField,
						pathToValue: string[],
					): {
						path: string[];
						value: string;
					}[] => {
						if (field.type === 'field')
							return Object.entries(field)
								.filter(([key]) => key !== 'type')
								.map(([key, value]: [string, string | boolean]) => ({
									path: [...pathToValue, key],
									value: value.toString(),
								}));

						if (!field.fields) throw new Error("Body collection hasn't 'fields' prop");

						return Object.entries(field.fields).flatMap(([key, value], index) => {
							const newPath = [...pathToValue, index.toString()];
							return [{ path: newPath, value: key }, ...extractValue(value, newPath)];
						});
					};

					return Object.entries(bodyPart.fields).flatMap(([key, value], index) => {
						const newPath = [...path, index.toString()];
						return [{ path: newPath, value: key }, ...extractValue(value, newPath)];
					});
				};

				const bodyAsString = JSON.stringify(body).replace(
					/:[{|[]/gm,
					(str: string) => `${str[0]} ${str[1]}`,
				);

				if (!filters.body.values.length || filters.body.negative)
					return <>{trimValue(bodyAsString)}</>;

				const values = body.flatMap((bodyPart, index) => {
					switch (bodyPart.type) {
						case EventBodyPayloadType.MESSAGE:
							return [
								{
									path: [index.toString()],
									value: bodyPart.data,
								},
							];
						case EventBodyPayloadType.TABLE:
							return tableEntries(bodyPart, [index.toString()]);
						case EventBodyPayloadType.TREE_TABLE:
							return treeTableEntries(bodyPart, [index.toString()]);
						case EventBodyPayloadType.VERIFICATION:
							return verificationEntries(bodyPart, [index.toString()]);
						default:
							return [];
					}
				});

				const sortedEntries = getSortedEntries(bodyAsString, filters.body.values);

				const uniqueValues = [...new Set(values.map(({ value }) => value))];

				const entryCounts = new Map<string, Map<number, number>>();

				return (
					<>
						{sortedEntries.map(({ value }, idx, arr) => {
							const clickable = uniqueValues.some(v => v.includes(value));

							const valueMaps = entryCounts.get(value);
							if (valueMaps) {
								valueMaps.set(idx, valueMaps.size + 1);
							} else {
								entryCounts.set(value, new Map([[idx, 1]]));
							}

							return (
								<React.Fragment key={`${value}-${idx}`}>
									<span
										className={clickable ? 'filtered' : undefined}
										onClick={() => {
											if (clickable) {
												const filterEntry = values.filter(({ value: v }) => v.includes(value))[
													// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
													entryCounts.get(value)!.get(idx)! - 1
												];
												const valueIndex = filterEntry.value.indexOf(value);
												onResultClick(result, {
													type: 'body',
													entry: {
														path: filterEntry.path,
														range: [valueIndex, valueIndex + value.length - 1],
													},
												});
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
			type: type => {
				if (!filters.type.values.length || filters.type.negative) return <>{type}</>;

				return (
					<>{filters.type.values.filter(filterValue => type.includes(filterValue)).join(', ')}</>
				);
			},
			parsedMessages: parsedMessages => {
				if (!parsedMessages) return <>{null}</>;

				const { fields, ...bodyWithoutFields } = parsedMessages[0].message;

				const sortedObject = {
					...parsedMessages[0],
					fields: Object.fromEntries(getSortedFields(parsedMessages[0].message.fields)),
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
											entry: {
												path: [],
												range: [range[0] - offset, range[1] - offset] as [number, number],
											},
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
			rawMessageBase64: binary => {
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
											entry: {
												path: [],
												range: [range[0], range[1]],
											},
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

	const rootClassName = createBemBlock(
		'search-result',
		result.type,
		highlighted ? 'highlight' : null,
	);

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
		<div className={rootClassName}>
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
