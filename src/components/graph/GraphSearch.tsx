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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import eventHttpApi from '../../api/event';
import messageHttpApi from '../../api/message';
import { isEventAction } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { useDebouncedCallback } from '../../hooks';
import { useOutsideClickListener } from '../../hooks/useOutsideClickListener';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { TimeInputType } from '../../models/filter/FilterInputs';
import { Timestamp } from '../../models/Timestamp';
import GraphSearchDialog from './GraphSearchDialog';
import localStorageWorker from '../../util/LocalStorageWorker';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import { ModalPortal } from '../util/Portal';
import FilterDatetimePicker from '../filter/date-time-inputs/FilterDatetimePicker';
import GraphSearchInput from './GraphSearchInput';
import GraphSearchHistory from './GraphSearchHistory';

const getTimestamp = (timestamp: Timestamp) => {
	const ms = Math.floor(timestamp.nano / 1000000);
	return +`${timestamp.epochSecond}${ms}`;
};

interface Props {
	onTimestampSubmit: (timestamp: number) => void;
	onFoundItemClick: InstanceType<typeof WorkspaceStore>['onSavedItemSelect'];
}

const GraphSearch = (props: Props) => {
	const { onTimestampSubmit, onFoundItemClick } = props;

	const [currentValue, setCurrentValue] = React.useState('');
	const [foundObject, setFoundbject] = React.useState<EventAction | EventMessage | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isError, setIsError] = React.useState(false);
	const [showPicker, setShowPicker] = React.useState(false);
	const [showDialog, setShowDialog] = React.useState(false);
	const [history, setHistory] = React.useState<Array<EventAction | EventMessage>>(
		localStorageWorker.getGraphSearchHistory(),
	);
	const [timestamp, setTimestamp] = React.useState<number | null>(null);
	const [showHistory, setShowHistory] = React.useState(false);

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const timeout = React.useRef<NodeJS.Timeout>();
	const modalRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(
		wrapperRef,
		e => {
			const modalIsOpen = showDialog || showHistory || showPicker;

			if (
				modalIsOpen &&
				e.target instanceof Node &&
				!wrapperRef.current?.contains(e.target) &&
				!modalRef.current?.contains(e.target)
			) {
				setShowPicker(false);
				setShowDialog(false);
				setShowHistory(false);
			}
		},
		'mouseup',
	);

	React.useEffect(() => {
		const ac = new AbortController();

		if (currentValue) {
			setShowDialog(true);
			setIsLoading(true);
			setTimestampFromFoundObject(ac);
			setIsError(false);
			setFoundbject(null);
		} else {
			setShowDialog(false);
			setIsLoading(false);
			setIsError(false);
			setFoundbject(null);
		}

		return () => {
			ac.abort();
		};
	}, [currentValue]);

	React.useEffect(() => {
		if (foundObject) {
			setIsLoading(false);
			setIsError(false);
			onFoundItemClick(foundObject);
			const updatedHistory = [...history, foundObject];
			localStorageWorker.saveGraphSearchHistory(updatedHistory);
			setHistory(updatedHistory);
			timeout.current = setTimeout(() => {
				setShowDialog(false);
			}, 2000);
		}
	}, [foundObject]);

	const onObjectFound = (
		object: null | EventAction | EventMessage,
		id: string,
		ac: AbortController,
	) => {
		setIsLoading(false);
		if (!object) {
			return;
		}
		ac.abort();
		const timestamFromFoundObject = isEventAction(object)
			? getTimestamp(object.startTimestamp)
			: getTimestamp(object.timestamp);
		setTimestamp(timestamFromFoundObject);
	};

	const setTimestampFromFoundObject = useDebouncedCallback((ac: AbortController) => {
		eventHttpApi
			.getEvent(currentValue, ac.signal, { probe: true })
			.then(foundEvent => {
				setFoundbject(foundEvent);
				onObjectFound(foundEvent, currentValue, ac);
			})
			.catch(err => {
				if (err.name !== 'AbortError') {
					setIsError(true);
				}
			});
		messageHttpApi
			.getMessage(currentValue, ac.signal, { probe: true })
			.then(message => {
				setFoundbject(message);
				onObjectFound(message, currentValue, ac);
			})
			.catch(err => {
				if (err.name !== 'AbortError') {
					setIsError(true);
				}
			});
	}, 500);

	const onSubmit = (value: number | string) => {
		if (typeof value === 'number') {
			onTimestampSubmit(value);
			setCurrentValue('');
		} else {
			setCurrentValue(value);
		}
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		e.target.setSelectionRange(0, currentValue.length);
		setShowDialog(true);
		if (timeout.current) clearTimeout(timeout.current);
		setFoundbject(null);
	};

	const dialogClassName = createBemElement(
		'graph-search-input',
		'dialog',
		foundObject || isLoading || history.length > 0 ? 'bordered' : null,
	);

	const handleTimepickerValueChange = (value: number | null) => {
		setTimestamp(value);
	};

	const openTimePicker = React.useCallback(() => {
		if (!showPicker) setShowPicker(true);
	}, [setShowPicker, showPicker]);

	const closeTimePicker = React.useCallback(() => {
		if (showPicker) setShowPicker(false);
	}, [setShowPicker, showPicker]);

	const openHistory = React.useCallback(() => {
		if (!showHistory) setShowHistory(true);
	}, [setShowHistory, showHistory]);

	const closeHistory = React.useCallback(() => {
		if (showHistory) setShowHistory(false);
	}, [setShowHistory, showHistory]);

	const onHistoryItemDelete = (historyItem: EventAction | EventMessage) => {
		const updatedHistory = history.filter(item => item !== historyItem);
		setHistory(updatedHistory);
		localStorageWorker.saveGraphSearchHistory(updatedHistory);
	};

	return (
		<div className='graph-search' ref={wrapperRef}>
			<GraphSearchInput
				onSubmit={onSubmit}
				timestamp={timestamp}
				setTimestamp={setTimestamp}
				openHistory={openHistory}
				closeHistory={closeHistory}
				openTimePicker={openTimePicker}
				closeTimePicker={closeTimePicker}
			/>
			<ModalPortal
				isOpen={showPicker || showDialog || showHistory}
				ref={modalRef}
				style={{
					left: '50%',
					transform: 'translateX(-50%)',
					top: wrapperRef.current?.getBoundingClientRect().bottom || 30,
					position: 'absolute',
					zIndex: 322,
				}}>
				{showPicker && (
					<FilterDatetimePicker
						className='graph-search-picker'
						setValue={handleTimepickerValueChange}
						type={TimeInputType.DATE_TIME}
						value={timestamp}
					/>
				)}
				{showDialog && (
					<GraphSearchDialog
						isError={isError}
						className={dialogClassName}
						isLoading={isLoading}
						foundObject={foundObject}
					/>
				)}
				{showHistory && (
					<GraphSearchHistory history={history} onHistoryItemDelete={onHistoryItemDelete} />
				)}
			</ModalPortal>
		</div>
	);
};

export default GraphSearch;
