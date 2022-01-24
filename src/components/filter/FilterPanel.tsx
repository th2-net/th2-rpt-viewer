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
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useOutsideClickListener } from '../../hooks';
import { ModalPortal } from '../util/Portal';
import FilterRow from './row';
import { raf } from '../../helpers/raf';
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import '../../styles/filter.scss';

const PANEL_WIDTH = 840;

interface Props {
	isFilterApplied: boolean;
	isLoading?: boolean;
	isDisabled?: boolean;
	showFilter: boolean;
	config: FilterRowConfig[];
	setShowFilter: (isShown: boolean) => void;
	onSubmit: () => void;
	onClearAll: () => void;
	renderFooter?: () => React.ReactNode;
}

const FilterPanel = (props: Props) => {
	const {
		isFilterApplied,
		showFilter,
		setShowFilter,
		config,
		isDisabled = false,
		onSubmit,
		onClearAll,
		renderFooter,
		isLoading,
	} = props;

	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		if (showFilter) {
			raf(() => {
				if (filterBaseRef.current && filterButtonRef.current) {
					const clientWidth = document.documentElement.clientWidth;
					const { left, bottom } = filterButtonRef.current?.getBoundingClientRect();

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
		'filter-wrapper',
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
				<div ref={filterBaseRef} className='filter'>
					{config
						.sort((a, b) => {
							if (Array.isArray(a)) {
								if (Array.isArray(b)) {
									return a[0].id.localeCompare(b[0].id);
								}
								return 1;
							}
							if (Array.isArray(b)) {
								if (Array.isArray(a)) {
									return a[0].id.localeCompare(b[0].id);
								}
								return -1;
							}
							return a.id.localeCompare(b.id);
						})
						.map(rowConfig =>
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
					<div className='filter__controls filter-controls'>
						{renderFooter && renderFooter()}
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
