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
import { ModalPortal } from '../util/Portal';
import '../../styles/filters-history.scss';
import { useOutsideClickListener, useFiltersHistoryStore } from '../../hooks';
import { raf } from '../../helpers/raf';
import { SearchPanelType } from '../search-panel/SearchPanel';
import FiltersHistoryItem from './FiltersHistoryItem';
import { useSearchStore } from '../../hooks/useSearchStore';
import { EventFilterState, MessageFilterState } from '../search-panel/SearchPanelFilters';

interface Props {
	type?: SearchPanelType;
	sseFilter?: FiltersState;
}

export type FiltersState = {
	state: EventFilterState | MessageFilterState;
	setState:
		| ((patch: Partial<EventFilterState>) => void)
		| ((patch: Partial<MessageFilterState>) => void);
} | null;

const FiltersHistory = ({ type, sseFilter }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);
	const { history } = useFiltersHistoryStore();
	const { filters, formType } = useSearchStore();

	const toShow = useMemo(
		() => history.filter(item => (type ? item.type === type : item.type === formType)),
		[history, type, formType],
	);

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
					const { left, bottom } = buttonRef.current?.getBoundingClientRect();
					historyRef.current.style.left = `${left}px`;
					historyRef.current.style.top = `${bottom}px`;
				}
			}, 2);
		}
	}, [isOpen]);

	useOutsideClickListener(historyRef, (e: MouseEvent) => {
		if (e.target !== buttonRef.current) {
			setIsOpen(false);
		}
	});

	return toShow.length ? (
		<>
			<button
				ref={buttonRef}
				className='filters-history-open'
				onClick={() => {
					setIsOpen(o => !o);
				}}>
				Filters history
			</button>

			<ModalPortal isOpen={isOpen}>
				<div ref={historyRef} className='filters-history'>
					{toShow.map(item => (
						<FiltersHistoryItem key={item.timestamp} item={item} filter={filtersState} />
					))}
				</div>
			</ModalPortal>
		</>
	) : null;
};

export default observer(FiltersHistory);
