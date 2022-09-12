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
import { motion } from 'framer-motion';
import moment from 'moment';
import {
	FilterRowConfig,
	FilterRowMultipleStringsConfig,
	FilterRowTimeWindowConfig,
	DateTimeMask,
	TimeInputType,
} from '../../models/filter/FilterInputs';
import { getMessagesSSEParamsFromFilter, MessageFilterKeys } from '../../api/sse';
import { useMessagesWorkspaceStore, useOutsideClickListener } from '../../hooks';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { ModalPortal } from '../util/Portal';
import { useFilterConfig } from '../../hooks/useFilterConfig';
import { FilterRows } from '../filter/FilerRows';
import MessagesFilter from '../../models/filter/MessagesFilter';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

function ReplayModal() {
	const messagesStore = useMessagesWorkspaceStore();
	const filterStore = messagesStore.filterStore;

	const rootRef = React.useRef<HTMLDivElement>(null);

	const [isCopied, setIsCopied] = React.useState(false);

	const [isOpen, setIsOpen] = React.useState(false);

	const [drag, setDrag] = React.useState(false);
	const [mouseDown, setMouseDown] = React.useState(false);

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

	const { config, setFilter, filter, currentValues } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
	});

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
		return [timestampFromConfig, sessionFilterConfig, ...config];
	}, [config, timestampFromConfig, sessionFilterConfig]);

	const textToCopy = React.useMemo(() => {
		const link = [
			window.location.origin,
			window.location.pathname,
			'backend/search/sse/messages/',
		].join('');

		let currentFilter = filter;

		if (currentFilter) {
			currentFilter = Object.entries(currentFilter).reduce((acc, filterItem) => {
				const [filterString, filterValue] = filterItem;
				const currentValue = currentValues[filterString as keyof MessagesFilter];

				return {
					...acc,
					[filterString]: {
						...filterValue,
						values: [...filterValue.values, currentValue].filter(Boolean),
					},
				};
			}, {} as MessagesFilter);
		}

		const params = getMessagesSSEParamsFromFilter(
			currentFilter,
			[...streams, currentStream].filter(Boolean),
			startTimestamp,
			endTimestamp,
			'next',
		).toString();
		return `${link}?${params}`;
	}, [filter, streams, startTimestamp, endTimestamp, currentStream, currentValues]);

	function toggleReplayModal() {
		if (!isOpen) {
			const { timestampTo, timestampFrom } = messagesStore.filterStore.filter;

			setStreams(messagesStore.filterStore.filter.streams.slice());
			setCurrentStream('');
			setStartTimestamp(timestampFrom || moment().subtract(30, 'minutes').valueOf());
			setEndTimestamp(timestampTo);
			setFilter(messagesStore.filterStore.sseMessagesFilter);
			setIsOpen(true);
		} else {
			setIsOpen(false);
		}
	}

	function onCopy() {
		copyTextToClipboard(textToCopy);
		setIsCopied(true);
	}

	const refConstrains = React.useRef(null);

	return (
		<>
			<span className='replay__toggle-button' onClick={toggleReplayModal}>
				Replay
			</span>
			<ModalPortal isOpen={isOpen}>
				<motion.div className='replay__drag-area' ref={refConstrains} />
				<motion.div
					dragElastic={false}
					dragMomentum={false}
					dragConstraints={refConstrains}
					drag={drag || mouseDown}
					className='replay'
					ref={rootRef}>
					<div
						className='dragable-area'
						onMouseOver={() => setDrag(true)}
						onMouseLeave={() => setDrag(false)}
						onMouseDown={() => setMouseDown(true)}
						onMouseUp={() => setMouseDown(false)}
					/>
					<button className='replay__close-button' onClick={() => setIsOpen(false)}>
						<i></i>
					</button>
					<FilterRows config={filterConfig} headerClassName={'replay__compound-header'} />
					<p className='replay__generated-text'>
						<a href={textToCopy} rel='noopener noreferrer' target='_blank'>
							{textToCopy}
						</a>
					</p>
					<button
						style={{
							cursor: isCopied ? 'default' : 'pointer',
						}}
						disabled={isCopied}
						className='replay__copy-button'
						onClick={onCopy}>
						{isCopied ? 'Copied to clipboard' : 'Copy'}
					</button>
				</motion.div>
			</ModalPortal>
		</>
	);
}

export default observer(ReplayModal);
