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
import { TIME_INPUT_MASK, DATE_TIME_INPUT_MASK } from 'models/util/filterInputs';
import {
	FilterRowConfig,
	FilterRowMultipleStringsConfig,
	FilterRowTimeWindowConfig,
	DateTimeMask,
	TimeInputType,
} from 'models/filter/FilterInputs';
import { FilterKeys, getMessagesSSEParams, MessageFilterKeys } from 'api/sse';
import { useOutsideClickListener } from 'hooks/index';
import { copyTextToClipboard } from 'helpers/copyHandler';
import { ModalPortal } from 'components/util/Portal';
import { useFilterConfig } from 'hooks/useFilterConfig';
import { FilterRows } from 'components/filter/FilterRows';
import { ButtonBase } from 'components/buttons/ButtonBase';
import MessagesFilter from 'models/filter/MessagesFilter';
import { Button } from 'components/buttons/Button';
import { useMessagesStore } from '../../hooks/useMessagesStore';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

function ReplayModal() {
	const messagesStore = useMessagesStore();
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
		filter: filterStore.filter,
		order: filterOrder,
	});

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(
		() => ({
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: messagesStore.messageSessions,
			wrapperClassName: 'messages-window-header__session-filter',
			label: 'Session names',
		}),
		[streams, setStreams, currentStream, setCurrentStream, messagesStore.messageSessions],
	);

	const timestampFromConfig: FilterRowTimeWindowConfig[] = React.useMemo(
		() => [
			{
				id: 'replay-timerange',
				inputs: [
					{
						dateTimeMask: DateTimeMask.DATE_TIME_MASK,
						dateMask: DateTimeMask.DATE_MASK,
						timeMask: DateTimeMask.TIME_MASK,
						id: 'replay-startTimestamp',
						dateTimeInputMask: DATE_TIME_INPUT_MASK,
						timeInputMask: TIME_INPUT_MASK,
						placeholder: '',
						setValue: setStartTimestamp,
						value: startTimestamp,
						type: TimeInputType.DATE_TIME,
					},
					{
						dateTimeMask: DateTimeMask.DATE_TIME_MASK,
						dateMask: DateTimeMask.DATE_MASK,
						timeMask: DateTimeMask.TIME_MASK,
						id: 'replay-endTimestamp',
						dateTimeInputMask: DATE_TIME_INPUT_MASK,
						timeInputMask: TIME_INPUT_MASK,
						placeholder: '',
						setValue: setEndTimestamp,
						value: endTimestamp,
						type: TimeInputType.DATE_TIME,
					},
				],
				type: 'time-window',
			},
		],
		[startTimestamp, endTimestamp],
	);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(
		() => [timestampFromConfig, sessionFilterConfig, ...config],
		[config, timestampFromConfig, sessionFilterConfig],
	);

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
				const currentValue = currentValues[filterString as FilterKeys];

				return {
					...acc,
					[filterString]: {
						...filterValue,
						values: [...filterValue.values, currentValue].filter(Boolean),
					},
				};
			}, {} as MessagesFilter);
		}

		const params = getMessagesSSEParams(currentFilter, {
			endTimestamp,
			startTimestamp,
			streams: [...streams, currentStream].filter(Boolean),
		}).toString();
		return `${link}?${params}`;
	}, [filter, streams, startTimestamp, endTimestamp, currentStream, currentValues]);

	function toggleReplayModal() {
		if (!isOpen) {
			const { endTimestamp: timestampTo, startTimestamp: timestampFrom } =
				messagesStore.filterStore.params;

			setStreams(messagesStore.filterStore.params.streams.slice());
			setCurrentStream('');
			setStartTimestamp(timestampFrom || moment().subtract(30, 'minutes').valueOf());
			setEndTimestamp(timestampTo);
			setFilter(messagesStore.filterStore.filter);
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
			<ButtonBase onClick={toggleReplayModal}>
				<span>Replay</span>
			</ButtonBase>
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

					<Button
						style={{
							cursor: isCopied ? 'default' : 'pointer',
						}}
						variant='contained'
						disabled={isCopied}
						className='replay__copy-button'
						onClick={onCopy}>
						{isCopied ? 'Copied to clipboard' : 'Copy'}
					</Button>
				</motion.div>
			</ModalPortal>
		</>
	);
}

export default observer(ReplayModal);
