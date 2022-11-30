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

import React, { useState, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import EventsFilter from 'models/filter/EventsFilter';
import MessagesFilter from 'models/filter/MessagesFilter';
import { EntityType } from 'models/EventAction';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener, useFiltersHistoryStore } from '../../hooks';
import { useFilterConfigStore } from '../../hooks/useFilterConfigStore';
import { raf } from '../../helpers/raf';
import FiltersHistoryItem from './FiltersHistoryItem';
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import '../../styles/filters-history.scss';
import { FilterHistoryIcon } from '../icons/FilterHistoryIcon';

interface Props {
	type: EntityType;
	filter?: FiltersState;
	disabled?: boolean;
}

export type FiltersState = {
	state: EventsFilter | MessagesFilter;
	setState: ((patch: Partial<EventsFilter>) => void) | ((patch: Partial<MessagesFilter>) => void);
} | null;

const FiltersHistory = ({ type, filter, disabled = false }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);

	const { eventsHistory, messagesHistory, toggleFilterPin, deleteHistoryItem } =
		useFiltersHistoryStore();
	const { eventFilterInfo, messagesFilterInfo } = useFilterConfigStore();

	const toShow: (FiltersHistoryType<EventsFilter> | FiltersHistoryType<MessagesFilter>)[] = useMemo(
		() => (type === 'event' ? eventsHistory : messagesHistory),
		[eventsHistory, messagesHistory, type],
	);

	React.useLayoutEffect(() => {
		if (isOpen) {
			raf(() => {
				if (historyRef.current && buttonRef.current) {
					const { left, bottom } = buttonRef.current.getBoundingClientRect();
					historyRef.current.style.left = `${left}px`;
					historyRef.current.style.top = `${bottom - 45 - historyRef.current.clientHeight}px`;
				}
			}, 2);
		}
	}, [isOpen]);

	useOutsideClickListener(historyRef, (e: MouseEvent) => {
		const target = e.target as Element;
		if (target.closest('.filter-history-item')) {
			e.stopImmediatePropagation();
			return;
		}
		if (target !== buttonRef.current) {
			setIsOpen(false);
		}
	});

	const onFilterPin = React.useCallback(
		(pinnedFilter: FiltersHistoryType<EventsFilter | MessagesFilter>) => {
			toggleFilterPin(pinnedFilter);
			if (!pinnedFilter.isPinned) {
				raf(() => {
					historyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
				}, 2);
			}
		},
		[toggleFilterPin],
	);

	const closeHistory = React.useCallback(() => setIsOpen(false), [setIsOpen]);

	return toShow.length ? (
		<>
			<button
				ref={buttonRef}
				className='filters-history-open'
				onClick={() => {
					setIsOpen(o => !o);
				}}
				title={'Filters history'}
				disabled={disabled}>
				<FilterHistoryIcon className='history-icon' />
			</button>
			<ModalPortal isOpen={isOpen}>
				<div ref={historyRef} className='filters-history'>
					{filter &&
						toShow.map((item, index) => (
							<React.Fragment key={item.timestamp}>
								<FiltersHistoryItem
									item={item}
									filter={filter}
									eventsFilterInfo={eventFilterInfo}
									messagesFilterInfo={messagesFilterInfo}
									closeHistory={closeHistory}
									toggleFilterPin={onFilterPin}
									deleteHistoryItem={deleteHistoryItem}
								/>
								{toShow.length - 1 > index && <hr />}
							</React.Fragment>
						))}
				</div>
			</ModalPortal>
		</>
	) : (
		<button
			ref={buttonRef}
			className='filters-history-open'
			title={'Filters history'}
			disabled={true}>
			<FilterHistoryIcon className='filters-history-open history-icon' />
		</button>
	);
};

export default observer(FiltersHistory);
