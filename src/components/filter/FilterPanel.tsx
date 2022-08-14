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
import { EntityType } from 'models/EventAction';
import EventsFilter from 'models/filter/EventsFilter';
import MessagesFilter from 'models/filter/MessagesFilter';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useOutsideClickListener } from '../../hooks';
import { ModalPortal } from '../util/Portal';
import { raf } from '../../helpers/raf';
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import FiltersHistory from '../filters-history/FiltersHistory';
import { FilterRows } from './FilerRows';
import '../../styles/filter.scss';

const PANEL_WIDTH = 840;

interface Props<T extends MessagesFilter | EventsFilter> {
	isFilterApplied: boolean;
	isLoading: boolean;
	isDisabled?: boolean;
	showFilter: boolean;
	config: FilterRowConfig[];
	setShowFilter: (isShown: boolean) => void;
	onSubmit: () => void;
	onClearAll: () => void;
	filter?: T | null;
	setFilter?: (filter: Partial<T>) => void;
	type: EntityType;
}

const FilterPanel = <T extends MessagesFilter | EventsFilter>(props: Props<T>) => {
	const {
		isFilterApplied,
		showFilter,
		setShowFilter,
		config,
		isDisabled = false,
		onSubmit,
		onClearAll,
		isLoading,
		filter,
		type,
		setFilter,
	} = props;

	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		if (showFilter) {
			raf(() => {
				if (filterBaseRef.current && filterButtonRef.current) {
					const clientWidth = document.documentElement.clientWidth;
					const { left, bottom } = filterButtonRef.current.getBoundingClientRect();

					filterBaseRef.current.style.right = `${Math.max(clientWidth - left - PANEL_WIDTH, 10)}px`;
					filterBaseRef.current.style.top = `${bottom}px`;
					filterBaseRef.current.style.width = `${PANEL_WIDTH}px`;
					filterBaseRef.current.style.borderTopLeftRadius =
						clientWidth - left - PANEL_WIDTH < 10 ? '5px' : '';
				}
			}, 2);
		}
	}, [showFilter]);

	useOutsideClickListener(filterBaseRef, (e: MouseEvent) => {
		if (!filterButtonRef.current?.contains(e.target as Element)) {
			setShowFilter(false);
		}
	});

	function onSubmitClick() {
		onSubmit();
		setShowFilter(false);
	}

	function onClearAllClick() {
		onClearAll();
	}

	function onClick() {
		if (!isDisabled) {
			setShowFilter(!showFilter);
		}
	}

	const filterWrapperClass = createStyleSelector(
		'filter-panel__button',
		showFilter ? 'active' : null,
		isFilterApplied ? 'applied' : null,
	);

	const filterTitleClass = createBemElement(
		'filter',
		'title',
		showFilter ? 'active' : null,
		!showFilter && isFilterApplied ? 'applied' : null,
	);

	const filterIconClass = createBemElement(
		'filter',
		'icon',
		showFilter ? 'active' : null,
		!showFilter && isFilterApplied ? 'applied' : null,
	);

	const filterButtonClass = createBemElement(
		'filter',
		'button',
		isDisabled ? 'disabled' : null,
		showFilter ? 'active' : null,
		!showFilter && isFilterApplied ? 'applied' : null,
	);

	return (
		<div className={filterWrapperClass}>
			<div className={filterButtonClass} ref={filterButtonRef} onClick={onClick}>
				<div className={filterIconClass} />
				<div className={filterTitleClass}>{showFilter ? 'Hide Filter' : 'Show Filter'}</div>
				{typeof isLoading === 'boolean'
					? isLoading && <div style={{ marginLeft: 5 }} className='filter__loading' />
					: null}
			</div>
			<ModalPortal isOpen={showFilter}>
				<div ref={filterBaseRef} className='filter filter-panel'>
					<FilterRows config={config} />
					<div className='filter__controls filter-controls'>
						{filter && setFilter && (
							<FiltersHistory
								type={type}
								filter={{
									state: filter,
									setState: setFilter as any,
								}}
							/>
						)}
						<div className='filter-controls__clear-btn' onClick={onClearAllClick}>
							<div className='filter-controls__clear-icon' />
							Clear All
						</div>
						<div className='filter-row__button' onClick={onSubmitClick}>
							Submit filter
						</div>
					</div>
				</div>
			</ModalPortal>
		</div>
	);
};

export default React.memo(FilterPanel);
