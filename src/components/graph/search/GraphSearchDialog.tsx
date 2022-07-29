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
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import api from '../../../api';
import { getTimestampAsNumber } from '../../../helpers/date';
import { getItemId, getItemName } from '../../../helpers/event';
import { EventAction } from '../../../models/EventAction';
import { BookmarkItem } from '../../bookmarks/BookmarksPanel';
import Empty from '../../util/Empty';
import { useDebouncedCallback, useRootStore } from '../../../hooks';
import KeyCodes from '../../../util/KeyCodes';
import { indexedDbLimits, IndexedDbStores } from '../../../api/indexedDb';
import { GraphSearchResult } from './GraphSearch';
import { SearchDirection } from '../../../models/search/SearchDirection';
import { DateTimeMask } from '../../../models/filter/FilterInputs';
import { EventMessage } from '../../../models/EventMessage';

interface Props {
	value: string;
	onSearchResultSelect: (savedItem: GraphSearchResult) => void;
	setTimestamp: (timestamp: number) => void;
	setIsIdSearchDisabled: (isIdSearchDisabled: boolean) => void;
	closeModal: () => void;
	submittedId: String | null;
	isIdMode: boolean;
	isLoading: boolean;
	setIsLoading: (value: React.SetStateAction<boolean>) => void;
	submittedTimestamp: number | null;
}

const GraphSearchDialog = (props: Props) => {
	const {
		onSearchResultSelect,
		value,
		setTimestamp,
		setIsIdSearchDisabled,
		setIsLoading,
		closeModal,
		submittedId,
		isIdMode,
		isLoading,
		submittedTimestamp,
	} = props;

	const rootStore = useRootStore();

	const [currentSearchResult, setCurrentSearchResult] = React.useState<GraphSearchResult | null>(
		null,
	);

	const ac = React.useRef<AbortController | null>(null);

	const [foundId, setFoundId] = React.useState<string | null>(null);

	const [searchHistory, setSearchHistory] = React.useState<GraphSearchResult[]>([]);

	const sortedSearchHistory: GraphSearchResult[] = React.useMemo(() => {
		const sortedHistory = searchHistory.slice();
		sortedHistory.sort((itemA, itemB) => {
			if (itemA.timestamp > itemB.timestamp) return -1;
			if (itemA.timestamp < itemB.timestamp) return 1;
			return 0;
		});

		return sortedHistory;
	}, [searchHistory]);

	const filteredSearchHistory = React.useMemo(() => {
		if (!value) return sortedSearchHistory;
		const onlyIdFromHistory = sortedSearchHistory.map(historyItem => getItemId(historyItem.item));
		const uniqueSortedSearchHistory = sortedSearchHistory.filter(
			(historyItem, index) => onlyIdFromHistory.indexOf(getItemId(historyItem.item)) === index,
		);
		return uniqueSortedSearchHistory.filter(
			historyItem =>
				getItemId(historyItem.item).includes(value) ||
				getItemName(historyItem.item)?.includes(value) ||
				(foundId && getItemId(historyItem.item).includes(foundId)),
		);
	}, [sortedSearchHistory, value, foundId]);

	async function getGraphSearchHistory() {
		try {
			const graphSearchHistory = await api.indexedDb.getStoreValues<GraphSearchResult>(
				IndexedDbStores.GRAPH_SEARCH_HISTORY,
			);
			setSearchHistory(graphSearchHistory);
		} catch (error) {
			console.error("Couldn't fetch graph search history");
		}
	}

	React.useEffect(() => {
		getGraphSearchHistory();
	}, []);

	React.useEffect(() => {
		if (rootStore.resetGraphSearchData) {
			getGraphSearchHistory();
			rootStore.resetGraphSearchData = false;
		}
	}, [rootStore.resetGraphSearchData]);

	React.useEffect(() => {
		setIsIdSearchDisabled(!value || filteredSearchHistory.length > 1 || isLoading);
	}, [filteredSearchHistory, value, isLoading, isIdMode]);

	React.useEffect(() => {
		setFoundId(null);
		ac.current = new AbortController();
		if (value) {
			onValueChangeDebounced(value, ac.current);
			setCurrentSearchResult(null);
		} else {
			setIsLoading(false);
			setCurrentSearchResult(null);
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

			if (filteredSearchHistory.length === 1) {
				onSearchResultSelect(filteredSearchHistory[0]);
				setTimestamp(getTimestampAsNumber(filteredSearchHistory[0].item));
				closeModal();
			} else if (currentSearchResult && id === currentSearchResult.id) {
				onSearchResultSelect(currentSearchResult);
				setTimestamp(getTimestampAsNumber(currentSearchResult.item));
				closeModal();
			} else if (!currentSearchResult) {
				ac.current = new AbortController();
				onValueChange(id, ac.current);
			}
		}
	}, [submittedId]);

	React.useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		if (!submittedTimestamp) return () => {};
		let isCancelled = false;

		const queryParams = {
			startTimestamp: submittedTimestamp,
			resultCountLimit: 1,
			searchDirection: SearchDirection.Previous,
		} as const;

		const channels = [
			api.sse.getEventSource({
				type: 'event',
				queryParams,
			}),
			api.sse.getEventSource({
				type: 'event',
				queryParams: {
					...queryParams,
					endTimestamp: Date.now(),
					searchDirection: SearchDirection.Next,
				},
			}),
		];

		const results: EventAction[] = [];

		const getClosestResult = (events: EventAction[]): EventAction => {
			events.sort((eventA, eventB) => {
				const diffA = Math.abs(getTimestampAsNumber(eventA) - submittedTimestamp);
				const diffB = Math.abs(getTimestampAsNumber(eventB) - submittedTimestamp);
				if (diffA < diffB) {
					return -1;
				}
				if (diffA > diffB) {
					return 1;
				}
				return 0;
			});
			return events[0];
		};

		const stopSearch = (eventSource: EventSource) => () => {
			eventSource.close();

			if (channels.every(ch => ch.readyState === 2) && !isCancelled) {
				const event = getClosestResult(results);
				if (event) {
					ac.current = new AbortController();
					onSearchSuccess(event, submittedTimestamp);
					setFoundId(event.eventId);
				} else {
					setIsLoading(false);
				}
			}
		};

		const onResponse = (ev: Event) => {
			if (ev instanceof MessageEvent) {
				const parsedEvent = JSON.parse(ev.data) as EventAction;
				results.push(parsedEvent);
			}
		};

		channels.forEach(c => {
			c.addEventListener('event', onResponse);
			c.addEventListener('close', stopSearch(c));
			c.addEventListener('error', stopSearch(c));
		});

		return () => {
			isCancelled = true;
			channels.forEach(c => c.close());
		};
	}, [submittedTimestamp]);

	const onKeyDown = React.useCallback(
		(event: KeyboardEvent) => {
			if (!isIdMode) return;
			if (event.keyCode === KeyCodes.ENTER) {
				if (filteredSearchHistory.length === 1) {
					onSearchResultSelect(filteredSearchHistory[0]);
					setTimestamp(getTimestampAsNumber(filteredSearchHistory[0].item));
					closeModal();
				} else {
					ac.current = new AbortController();
					onValueChange(value, ac.current);
				}
			}
		},
		[filteredSearchHistory, value, isIdMode],
	);

	React.useEffect(() => {
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [onKeyDown]);

	const isTimestamp = (searchValue: string) => {
		return (
			moment(searchValue, DateTimeMask.TIME_MASK, true).isValid() ||
			moment(searchValue, DateTimeMask.DATE_TIME_MASK, true).isValid()
		);
	};

	const onValueChange = (searchValue: string, abortController: AbortController) => {
		if (!isIdMode || !searchValue || filteredSearchHistory.length > 1 || isTimestamp(searchValue))
			return;

		if (filteredSearchHistory.length !== 1) {
			fetchObjectById(searchValue, abortController);
			setCurrentSearchResult(null);
		}
	};

	const onValueChangeDebounced = useDebouncedCallback(onValueChange, 350);

	const onHistoryItemDelete = React.useCallback(
		async (historyItem: GraphSearchResult) => {
			try {
				await api.indexedDb.deleteDbStoreItem(IndexedDbStores.GRAPH_SEARCH_HISTORY, historyItem.id);
			} finally {
				setSearchHistory(history => history.filter(item => item !== historyItem));
			}
		},
		[setSearchHistory],
	);

	const fetchObjectById = (id: string, abortController: AbortController) => {
		const searchTimestamp = moment.utc().valueOf();
		function handleError(err: any) {
			if (err.name !== 'AbortError') {
				setIsLoading(false);
			}
		}
		Promise.all([
			api.events
				.getEvent(id, abortController.signal, { probe: true })
				.then((foundEvent: EventAction | null) => {
					if (foundEvent !== null) {
						onSearchSuccess(foundEvent, searchTimestamp);
						abortController.abort();
					}
				})
				.catch(handleError),
			api.messages
				.getMessage(id, abortController.signal, { probe: true })
				.then(foundMessage => {
					if (foundMessage !== null) {
						onSearchSuccess(foundMessage, searchTimestamp);
						abortController.abort();
					}
				})
				.catch(handleError),
		]).then(() => setIsLoading(false));
	};

	async function onSearchSuccess(responseObject: EventAction | EventMessage, timestamp: number) {
		const searchResult: GraphSearchResult = {
			timestamp,
			id: getItemId(responseObject),
			item: responseObject,
		};
		setCurrentSearchResult(searchResult);

		try {
			const graphSearchHistoryIds = await api.indexedDb.getStoreKeys<string>(
				IndexedDbStores.GRAPH_SEARCH_HISTORY,
			);

			if (graphSearchHistoryIds.length >= indexedDbLimits['graph-search-history']) {
				const keysToDelete = graphSearchHistoryIds.slice(
					0,
					graphSearchHistoryIds.length - indexedDbLimits['graph-search-history'] + 1,
				);

				await Promise.all(
					keysToDelete.map(graphSearchHistoryId =>
						api.indexedDb.deleteDbStoreItem(
							IndexedDbStores.GRAPH_SEARCH_HISTORY,
							graphSearchHistoryId,
						),
					),
				);
			}
			await api.indexedDb.updateDbStoreItem(IndexedDbStores.GRAPH_SEARCH_HISTORY, searchResult);
		} finally {
			setSearchHistory(history => [...history, searchResult]);
			setIsLoading(false);
		}
	}

	const searchResultIsEmpty = value && !isLoading && !currentSearchResult;

	return (
		<div className='graph-search-dialog'>
			{isLoading && <div className='graph-search-dialog__loader' />}
			{filteredSearchHistory.length > 0 && (
				<div className='graph-search-dialog__history-list'>
					{filteredSearchHistory
						.sort((a, b) => b.timestamp - a.timestamp)
						.map(searchResult => (
							<BookmarkItem
								key={searchResult.id}
								bookmark={searchResult.item}
								onClick={() => onSearchResultSelect(searchResult)}
								onRemove={() => onHistoryItemDelete(searchResult)}
								isBookmarkButtonDisabled={rootStore.isBookmarksFull}
							/>
						))}
				</div>
			)}
			{filteredSearchHistory.length === 0 && !isLoading && (
				<div className='graph-search-dialog__history'>
					<Empty
						description={searchResultIsEmpty ? 'No results found' : 'Search history is empty'}
					/>
				</div>
			)}
		</div>
	);
};

export default observer(GraphSearchDialog);
