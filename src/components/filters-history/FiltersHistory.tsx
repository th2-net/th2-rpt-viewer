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
import { EventFilterState, MessageFilterState } from 'modules/search/models/Search';
import { SearchPanelType } from 'modules/search/components/SearchPanel';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener, useFiltersHistoryStore } from '../../hooks';
import { raf } from '../../helpers/raf';
import FiltersHistoryItem from './FiltersHistoryItem';
import { useSearchStore } from '../../hooks/useSearchStore';
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import '../../styles/filters-history.scss';

interface Props {
	type?: SearchPanelType;
	sseFilter?: FiltersState;
	disabled?: boolean;
}

export type FiltersState = {
	state: EventFilterState | MessageFilterState;
	setState:
		| ((patch: Partial<EventFilterState>) => void)
		| ((patch: Partial<MessageFilterState>) => void);
} | null;

const FiltersHistory = ({ type, sseFilter, disabled = false }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);

	const { eventsHistory, messagesHistory, toggleFilterPin } = useFiltersHistoryStore();
	const { filters, formType, eventFilterInfo, messagesFilterInfo } = useSearchStore();

	const toShow: (FiltersHistoryType<EventFilterState> | FiltersHistoryType<MessageFilterState>)[] =
		useMemo(() => {
			const fType = type || formType;
			return fType === 'event' ? eventsHistory : messagesHistory;
		}, [eventsHistory, messagesHistory, type, formType]);

	const filtersState: FiltersState = useMemo(() => {
		if (sseFilter) {
			return sseFilter;
		}
		return filters
			? {
					state: filters.state,
					setState: filters.setState,
			  }
			: null;
	}, [filters, sseFilter]);

	React.useLayoutEffect(() => {
		if (isOpen) {
			raf(() => {
				if (historyRef.current && buttonRef.current) {
					const { left, bottom } = buttonRef.current.getBoundingClientRect();
					historyRef.current.style.left = `${left}px`;
					historyRef.current.style.top = `${bottom}px`;
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
		(filter: FiltersHistoryType<EventFilterState | MessageFilterState>) => {
			const isPinnedUpdated = !filter.isPinned;
			toggleFilterPin(filter);
			if (isPinnedUpdated) {
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
				disabled={disabled}></button>
			<ModalPortal isOpen={isOpen}>
				<div ref={historyRef} className='filters-history'>
					{toShow.map((item, index) => (
						<React.Fragment key={item.timestamp}>
							<FiltersHistoryItem
								item={item}
								filter={filtersState}
								eventsFilterInfo={eventFilterInfo}
								messagesFilterInfo={messagesFilterInfo}
								closeHistory={closeHistory}
								toggleFilterPin={onFilterPin}
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
			disabled={true}></button>
	);
};

export default observer(FiltersHistory);
