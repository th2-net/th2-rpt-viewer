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
import eventHttpApi from '../../../api/event';
import messageHttpApi from '../../../api/message';
import { getTimestampAsNumber } from '../../../helpers/date';
import { getItemId, isEventAction } from '../../../helpers/event';
import { EventAction, EventTreeNode } from '../../../models/EventAction';
import { EventMessage } from '../../../models/EventMessage';
import { BookmarkItem } from '../../BookmarksPanel';
import Empty from '../../util/Empty';
import localStorageWorker from '../../../util/LocalStorageWorker';
import { useDebouncedCallback } from '../../../hooks';
import KeyCodes from '../../../util/KeyCodes';

interface Props {
	value: string;
	onSavedItemSelect: (savedItem: EventTreeNode | EventAction | EventMessage) => void;
	setTimestamp: (timestamp: number) => void;
	setIsIdSearchDisabled: (isIdSearchDisabled: boolean) => void;
	closeModal: () => void;
	submittedId: String | null;
	isIdMode: boolean;
}

const GraphSearchDialog = (props: Props) => {
	const {
		onSavedItemSelect,
		value,
		setTimestamp,
		setIsIdSearchDisabled,
		closeModal,
		submittedId,
		isIdMode,
	} = props;

	const [isLoading, setIsLoading] = React.useState(false);
	const [foundObject, setFoundbject] = React.useState<EventAction | EventMessage | null>(null);

	const ac = React.useRef<AbortController | null>(null);

	const [history, setHistory] = React.useState<Array<EventAction | EventMessage>>(
		localStorageWorker.getGraphSearchHistory(),
	);

	const filteredHistory = React.useMemo(() => {
		if (!value) return history;
		return history.filter(historyItem => getItemId(historyItem).includes(value));
	}, [history, value]);

	React.useEffect(() => {
		setIsIdSearchDisabled(!value || filteredHistory.length > 1 || isLoading);
	}, [filteredHistory, value, isLoading, isIdMode]);

	React.useEffect(() => {
		ac.current = new AbortController();

		if (value) {
			onValueChangeDebounced(value, ac.current);
		} else {
			setIsLoading(false);
			setFoundbject(null);
		}

		return () => {
			if (ac.current) {
				ac.current.abort();
			}
		};
	}, [value]);

	React.useEffect(() => {
		if (submittedId !== null) {
			const id = submittedId.valueOf();

			if (foundObject && id === getItemId(foundObject)) {
				onSavedItemSelect(foundObject);
				setTimestamp(getTimestampAsNumber(foundObject));
				closeModal();
			}
			if (filteredHistory.length === 1) {
				onSavedItemSelect(filteredHistory[0]);
				setTimestamp(getTimestampAsNumber(filteredHistory[0]));
				closeModal();
			}

			if (filteredHistory.length !== 1 && !foundObject) {
				ac.current = new AbortController();
				onValueChange(id, ac.current);
			}
		}
	}, [submittedId]);

	function onSearchSuccess(responseObject: EventAction | EventMessage) {
		setFoundbject(responseObject);
		setIsLoading(false);
		setHistory([...history, responseObject]);
	}

	React.useEffect(() => {
		localStorageWorker.saveGraphSearchHistory(history);
	}, [history]);

	const onKeyDown = React.useCallback(
		(event: KeyboardEvent) => {
			if (event.keyCode === KeyCodes.ENTER) {
				if (filteredHistory.length === 1) {
					onSavedItemSelect(filteredHistory[0]);
					setTimestamp(getTimestampAsNumber(filteredHistory[0]));
					closeModal();
				} else {
					ac.current = new AbortController();
					onValueChange(value, ac.current);
				}
			}
		},
		[filteredHistory],
	);

	React.useEffect(() => {
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [onKeyDown]);

	const onValueChange = (searchValue: string, abortController: AbortController) => {
		if (!searchValue || filteredHistory.length > 1) return;

		if (filteredHistory.length !== 1) {
			fetchObjectById(searchValue, abortController);
			setFoundbject(null);
		}
	};

	const onValueChangeDebounced = useDebouncedCallback(onValueChange, 350);

	const onHistoryItemDelete = React.useCallback(
		(historyItem: EventAction | EventMessage) => {
			setHistory(history.filter(item => item !== historyItem));
		},
		[history, setHistory],
	);

	const fetchObjectById = (id: string, abortController: AbortController) => {
		setIsLoading(true);
		function handleError(err: any) {
			if (err.name !== 'AbortError') {
				setIsLoading(false);
			}
		}
		Promise.all([
			eventHttpApi
				.getEvent(id, abortController.signal, { probe: true })
				.then((foundEvent: EventAction | null) => {
					if (foundEvent !== null) {
						onSearchSuccess(foundEvent);
						abortController.abort();
					}
				})
				.catch(handleError),
			messageHttpApi
				.getMessage(id, abortController.signal, { probe: true })
				.then(foundMessage => {
					if (foundMessage !== null) {
						onSearchSuccess(foundMessage);
						abortController.abort();
					}
				})
				.catch(handleError),
		]).then(() => setIsLoading(false));
	};

	const computeKey = (item: EventAction | EventMessage) => {
		return isEventAction(item) ? item.eventId : item.messageId;
	};

	const searchResultIsEmpty = value && !isLoading && !foundObject;

	const onSearchItemSelect = React.useCallback(
		(searchItem: EventMessage | EventAction | EventTreeNode) => {
			onSavedItemSelect(searchItem);
			closeModal();
		},
		[onSavedItemSelect],
	);

	return (
		<div className='graph-search-dialog'>
			{isLoading && <div className='graph-search-dialog__loader' />}
			{!isLoading && foundObject && (
				<div className='graph-search-dialog__result'>
					<BookmarkItem item={foundObject} />
				</div>
			)}
			{filteredHistory.length > 0 && (
				<>
					<h4 className='graph-search-dialog__history-title'>Search history</h4>
					<hr />
					<div className='graph-search-dialog__history-list'>
						{filteredHistory.map((item, index) => (
							<BookmarkItem
								key={`${computeKey(item)}-${index}`}
								item={item}
								onClick={onSearchItemSelect}
								onRemove={() => onHistoryItemDelete(item)}
							/>
						))}
					</div>
				</>
			)}
			{filteredHistory.length === 0 && !isLoading && (
				<div className='graph-search-dialog__history'>
					<Empty
						description={searchResultIsEmpty ? 'No results found' : 'Search history is empty'}
					/>
				</div>
			)}
		</div>
	);
};

export default GraphSearchDialog;
