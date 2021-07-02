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
import { observer } from 'mobx-react-lite';
import { MessageFilterState, MultipleStringFilter } from '../search-panel/SearchPanelFilters';
import {
	CompoundFilterRow,
	FilterRowConfig,
	FilterRowMultipleStringsConfig,
	FilterRowTogglerConfig,
	FilterRowTimeWindowConfig,
	DateTimeMask,
	TimeInputType,
} from '../../models/filter/FilterInputs';
import { getMessagesSSEParamsFromFilter, MessagesFilterInfo } from '../../api/sse';
import { useSearchStore } from '../../hooks/useSearchStore';
import { useMessagesWorkspaceStore, useOutsideClickListener } from '../../hooks';
import FilterRow from '../filter/row';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { ModalPortal } from '../util/Portal';
import { prettifyCamelcase } from '../../helpers/stringUtils';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

function MessageReplayModal() {
	const searchStore = useSearchStore();
	const messagesStore = useMessagesWorkspaceStore();

	const rootRef = React.useRef<HTMLDivElement>(null);

	const [isCopied, setIsCopied] = React.useState(false);

	const [isOpen, setIsOpen] = React.useState(false);

	const [sseFilter, setSSEFilter] = React.useState<MessageFilterState | null>(null);
	const [currentValues, setCurrentValues] = React.useState<CurrentSSEValues>({
		type: '',
		body: '',
		attachedEventIds: '',
	});

	const [startTimestamp, setStartTimestamp] = React.useState<null | number>(null);
	const [endTimestamp, setEndTimestamp] = React.useState<null | number>(null);

	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentStream, setCurrentStream] = React.useState('');

	useOutsideClickListener(rootRef, e => {
		if (rootRef.current && e.target instanceof Element && !rootRef.current.contains(e.target)) {
			setIsOpen(false);
		}
	});

	React.useEffect(() => {
		let timeout: NodeJS.Timeout;
		if (isCopied) {
			timeout = setTimeout(() => {
				setIsCopied(false);
			}, 3000);
		}
		return () => {
			clearTimeout(timeout);
		};
	}, [isCopied]);

	React.useEffect(() => {
		setSSEFilter(messagesStore.filterStore.sseMessagesFilter);
		setCurrentValues({
			type: '',
			body: '',
			attachedEventIds: '',
		});
	}, [messagesStore.filterStore.sseMessagesFilter]);

	const compoundFilterRow: Array<CompoundFilterRow> = React.useMemo(() => {
		if (!sseFilter) return [];
		// eslint-disable-next-line no-underscore-dangle
		const _sseFilter = sseFilter;
		function getState(
			name: keyof MessageFilterState,
		): MessageFilterState[keyof MessageFilterState] {
			return _sseFilter[name];
		}

		function getValuesUpdater<T extends keyof MessageFilterState>(name: T) {
			return function valuesUpdater<K extends MessageFilterState[T]>(values: K) {
				setSSEFilter(prevState => {
					if (prevState !== null) {
						return {
							...prevState,
							[name]: { ...prevState[name], values },
						};
					}

					return prevState;
				});
			};
		}

		function getToggler<T extends keyof MessageFilterState>(
			filterName: T,
			paramName: keyof MultipleStringFilter,
		) {
			return function toggler() {
				setSSEFilter(prevState => {
					if (prevState !== null) {
						return {
							...prevState,
							[filterName]: {
								...prevState[filterName],
								[paramName]: !prevState[filterName][paramName],
							},
						};
					}

					return prevState;
				});
			};
		}

		const setCurrentValue = (name: keyof MessageFilterState) => (value: string) => {
			setCurrentValues(prevState => ({ ...prevState, [name]: value }));
		};

		return searchStore.messagesFilterInfo.map<CompoundFilterRow>((filter: MessagesFilterInfo) => {
			const label = prettifyCamelcase(filter.name);
			return filter.parameters.map<FilterRowTogglerConfig | FilterRowMultipleStringsConfig>(
				param => {
					switch (param.type.value) {
						case 'boolean':
							return {
								id: `${filter.name}-${param.name}`,
								label: param.name === 'negative' ? label : '',
								disabled: false,
								type: 'toggler',
								value: getState(filter.name)[param.name as keyof MultipleStringFilter],
								toggleValue: getToggler(filter.name, param.name as keyof MultipleStringFilter),
								possibleValues: param.name === 'negative' ? ['excl', 'incl'] : ['and', 'or'],
								className: 'filter-row__toggler',
							} as any;
						default:
							return {
								id: filter.name,
								label: '',
								type: 'multiple-strings',
								values: getState(filter.name).values,
								setValues: getValuesUpdater(filter.name),
								currentValue: currentValues[filter.name as keyof MessageFilterState],
								setCurrentValue: setCurrentValue(filter.name),
								autocompleteList: null,
							};
					}
				},
			);
		});
	}, [searchStore.messagesFilterInfo, sseFilter, setSSEFilter, currentValues]);

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(() => {
		return {
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: messagesStore.messageSessions,
			wrapperClassName: 'messages-window-header__session-filter',
			label: 'Session names',
		};
	}, [streams, setStreams, currentStream, setCurrentStream, messagesStore.messageSessions]);

	const timestampFromConfig: FilterRowTimeWindowConfig[] = React.useMemo(() => {
		return [
			{
				id: 'replay-timerange',
				inputs: [
					{
						dateMask: DateTimeMask.DATE_TIME_MASK,
						id: 'replay-startTimestamp',
						inputMask: DATE_TIME_INPUT_MASK,
						placeholder: '',
						setValue: setStartTimestamp,
						value: startTimestamp,
						type: TimeInputType.DATE_TIME,
					},
					{
						dateMask: DateTimeMask.DATE_TIME_MASK,
						id: 'replay-endTimestamp',
						inputMask: DATE_TIME_INPUT_MASK,
						placeholder: '',
						setValue: setEndTimestamp,
						value: endTimestamp,
						type: TimeInputType.DATE_TIME,
					},
				],
				type: 'time-window',
			},
		];
	}, [startTimestamp, endTimestamp]);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(() => {
		return [timestampFromConfig, sessionFilterConfig, ...compoundFilterRow];
	}, [compoundFilterRow, timestampFromConfig, sessionFilterConfig]);

	const textToCopy = React.useMemo(() => {
		const prefix = 'replay.py -u=';
		const link = [
			window.location.origin,
			window.location.pathname,
			'backend/search/sse/messages/',
		].join('');

		let filter = sseFilter;

		if (filter) {
			filter = Object.entries(filter).reduce((acc, currentFilter) => {
				const [filterString, filterValue] = currentFilter;
				const currentValue = currentValues[filterString as keyof MessageFilterState];

				return {
					...acc,
					[filterString]: {
						...filterValue,
						values: [...filterValue.values, currentValue].filter(Boolean),
					},
				};
			}, {} as MessageFilterState);
		}

		const params = getMessagesSSEParamsFromFilter(
			filter,
			[...streams, currentStream].filter(Boolean),
			startTimestamp,
			endTimestamp,
			'next',
		).toString();
		return `${prefix}'${link}?${params}'`;
	}, [streams, startTimestamp, endTimestamp, sseFilter, currentStream, currentValues]);

	function toggleReplayModal() {
		if (!isOpen) {
			const { timestampTo } = messagesStore.filterStore.filter;

			setStreams(messagesStore.filterStore.filter.streams.slice());
			setCurrentStream('');
			setStartTimestamp(timestampTo);
			setEndTimestamp(timestampTo ? timestampTo + 15 * 60 * 1000 : null);
			setCurrentValues({
				type: '',
				body: '',
				attachedEventIds: '',
			});
			setSSEFilter(messagesStore.filterStore.sseMessagesFilter);
			setIsOpen(true);
		} else {
			setIsOpen(false);
		}
	}

	function onCopy() {
		copyTextToClipboard(textToCopy);
		setIsCopied(true);
	}

	return (
		<>
			<span className='replay__toggle-button' onClick={toggleReplayModal}>
				Replay
			</span>
			<ModalPortal isOpen={isOpen}>
				<div className='replay' ref={rootRef}>
					<button className='replay__close-button' onClick={() => setIsOpen(false)}>
						<i></i>
					</button>
					{filterConfig.map(rowConfig =>
						Array.isArray(rowConfig) ? (
							<div className='filter__compound' key={rowConfig.map(c => c.id).join('-')}>
								{rowConfig.map(_rowConfig => (
									<FilterRow rowConfig={_rowConfig} key={_rowConfig.id} />
								))}
							</div>
						) : (
							<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
						),
					)}
					<p className='replay__generated-text'>{textToCopy}</p>
					<button
						style={{
							cursor: isCopied ? 'default' : 'pointer',
						}}
						disabled={isCopied}
						className='replay__copy-button'
						onClick={onCopy}>
						{isCopied ? 'Copied to clipboard' : 'Copy'}
					</button>
				</div>
			</ModalPortal>
		</>
	);
}

export default observer(MessageReplayModal);
