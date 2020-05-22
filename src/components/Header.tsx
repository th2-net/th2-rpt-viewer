/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../hooks/useStores';
import { useFirstEventWindowStore } from '../hooks/useFirstEventWindowStore';
import { formatTime, getTimestampAsNumber, getElapsedTime } from '../helpers/date';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import SearchInput from './search/SearchInput';
import FilterPanel from './filter/FilterPanel';
import useOutsideClickListener from '../hooks/useOutsideClickListener';
import { ToggleButton } from './ToggleButton';
import { ModalPortal } from './Portal';
import '../styles/header.scss';

function Header() {
	const { viewStore: appViewStore } = useStores();
	const eventWindowStore = useFirstEventWindowStore();

	const [showFilter, setShowFilter] = React.useState(false);
	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(filterBaseRef, (e: MouseEvent) => {
		if (!filterButtonRef.current?.contains(e.target as Element)) {
			setShowFilter(false);
		}
	});

	const status = !eventWindowStore?.selectedRootEvent
		? null
		: eventWindowStore.selectedRootEvent.successful
			? 'PASSED' : 'FAILED';

	const rootClass = createStyleSelector(
		'header',
		status,
	);
	const navButtonClass = createStyleSelector(
		'header-button',
		eventWindowStore.eventsIds.length > 1 ? '' : 'disabled',
		null,
	);

	const filterWrapperClass = createBemElement(
		'header-button',
		'filter-wrapper',
		showFilter ? 'active' : null,
	);

	const filterTitleClass = createBemElement(
		'header-button',
		'title',
		showFilter ? 'active' : null,
		!showFilter && eventWindowStore.filterStore.isFilterApplied ? 'applied' : null,
	);
	const filterIconClass = createBemElement(
		'header-button',
		'icon',
		'filter-icon',
		showFilter ? 'active' : null,
		!showFilter && eventWindowStore.filterStore.isFilterApplied ? 'applied' : null,
	);
	const eventsViewIconClass = createBemElement(
		'header-button',
		'icon',
		appViewStore.eventTableModeEnabled ? 'table-view' : 'tree-view',
	);

	const elapsedTime = eventWindowStore.selectedRootEvent?.endTimestamp
		&& eventWindowStore.selectedRootEvent?.startTimestamp
		? getElapsedTime(
			eventWindowStore.selectedRootEvent?.startTimestamp,
			eventWindowStore.selectedRootEvent?.endTimestamp,
			true,
		)
		: null;

	return (
		<div className={rootClass}>
			<div className="header__main   header-main">
				<div className="header__group">
					<div className="header-main__search">
						<SearchInput/>
					</div>
					<div className={filterWrapperClass}>
						<div className="header-button"
							ref={filterButtonRef}
							onClick={() => setShowFilter(!showFilter)}>
							<div className={filterIconClass}/>
							<div className={filterTitleClass}>
								{
									eventWindowStore.filterStore.isFilterApplied
										? 'Filter Applied'
										: showFilter
											? 'Hide Filter'
											: 'Show Filter'
								}
							</div>
						</div>
						<ModalPortal isOpen={showFilter}>
							<div
								ref={filterBaseRef}
								className="filter-wrapper"
								style={{
									left: `${filterButtonRef.current?.getBoundingClientRect().left}px`,
									top: `${filterButtonRef.current?.getBoundingClientRect().bottom}px`,
								}}>
								<FilterPanel />
							</div>
						</ModalPortal>
					</div>
					<div className='header-button'
					 onClick={() => appViewStore.setTableModeEnabled(!appViewStore.eventTableModeEnabled)}>
						<div className={eventsViewIconClass}/>
						<div className='header-button__title'>
							{
								appViewStore.eventTableModeEnabled
									? 'Table view'
									: 'Tree view'
							}
						</div>
					</div>
				</div>
				<div className="header-main__name header__group">
					<div className={navButtonClass}>
						<div
							className="header-button__icon left"
							onClick={eventWindowStore?.selectPrevEvent} />
					</div>
					{eventWindowStore?.selectedRootEvent
						?	<div className="header-main__title">
							{
								[
									eventWindowStore.selectedRootEvent.eventName,
									elapsedTime,
									status,
								].filter(Boolean).join(' — ')
							}
						</div>
						: 	<div className="header-main__title">
							{`${new Date().toLocaleDateString()} — ${eventWindowStore.eventsIds.length}`}
						</div>
					}

					<div className={navButtonClass}>
						<div
							className="header-button__icon right"
							onClick={eventWindowStore?.selectNextEvent} />
					</div>
				</div>
				<div className="header__group">
					<ToggleButton
						isToggled={!eventWindowStore.viewStore.showMessages}
						onClick={() => eventWindowStore.viewStore.showMessages = false}>
						Events
					</ToggleButton>
					<ToggleButton
						isToggled={eventWindowStore.viewStore.showMessages}
						onClick={() => eventWindowStore.viewStore.showMessages = true}>
						Messages
					</ToggleButton>
				</div>
			</div>
			{eventWindowStore?.selectedRootEvent
			&& <div className="header__info">
				{eventWindowStore.selectedRootEvent.startTimestamp
				&& 	<div className="header__info-element">
					<span>Start:</span>
					<p>
						{formatTime(getTimestampAsNumber(eventWindowStore.selectedRootEvent.startTimestamp))}
					</p>
				</div>}
				{eventWindowStore.selectedRootEvent.endTimestamp
				&& 	<div className="header__info-element">
					<span>Finish:</span>
					<p>
						{formatTime(getTimestampAsNumber(eventWindowStore.selectedRootEvent.endTimestamp))}
					</p>
				</div>}
			</div>}
		</div>
	);
}

export default observer(Header);
