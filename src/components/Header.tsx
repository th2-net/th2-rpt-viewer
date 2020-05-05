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
import { formatTime } from '../helpers/date';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import SearchInput from './search/SearchInput';
import FilterPanel from './filter/FilterPanel';
import useOutsideClickListener from '../hooks/useOutsideClickListener';
import { downloadTxtFile } from '../helpers/files/downloadTxt';
import { ToggleButton } from './ToggleButton';
import { getMessagesContent } from '../helpers/rawFormatter';
import { EventAction } from '../models/EventAction';
import { Views } from '../stores/ViewStore';
import '../styles/header.scss';

/* eslint-disable no-return-assign */
const Header = () => {
	const {
		selectedStore,
		filterStore,
		eventsStore,
		viewStore,
	} = useStores();

	const [showFilter, setShowFilter] = React.useState(false);
	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(filterBaseRef, (e: MouseEvent) => {
		if (!filterButtonRef.current?.contains(e.target as Element)) {
			setShowFilter(false);
		}
	});

	// eslint-disable-next-line no-nested-ternary
	const status = !eventsStore.selectedRootEvent
		? null
		: eventsStore.selectedRootEvent.successful
			? 'PASSED' : 'FAILED';

	const rootClass = createStyleSelector(
		'header',
		status,
	);
	const navButtonClass = createStyleSelector(
		'header-button',
		// reportStore.report?.metadata!.length > 1 ? '' : 'disabled',
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
		!showFilter && filterStore.isFilterApplied ? 'applied' : null,
	);
	const filterIconClass = createBemElement(
		'header-button',
		'icon',
		'filter-icon',
		showFilter ? 'active' : null,
		!showFilter && filterStore.isFilterApplied ? 'applied' : null,
	);

	const downloadMessages = (contentTypes: ('contentHumanReadable' | 'hexadecimal' | 'raw')[]) => {
		const content = getMessagesContent(selectedStore.messages, contentTypes);
		const fileName = `{EventName}_messages_${new Date().toISOString()}.txt`;
		downloadTxtFile([content], fileName);
	};

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
									// eslint-disable-next-line no-nested-ternary
									filterStore.isFilterApplied
										? 'Filter Applied'
										: showFilter
											? 'Hide Filter'
											: 'Show Filter'
								}
							</div>
							{
								filterStore.isFilterApplied && filterStore.isHighlighted ? (
									<div className="header-button__filter-counter">
										{
											selectedStore.messages.length > 99
												? '99+'
												: selectedStore.messages.length
										}
									</div>
								) : null
							}
						</div>
						{
							showFilter ? (
								<div ref={filterBaseRef} className="filter-wrapper">
									<FilterPanel/>
								</div>
							) : null
						}
					</div>
				</div>
				<div className="header-main__name header__group">
					<div className={navButtonClass}>
						<div
							className="header-button__icon left"
							onClick={eventsStore.selectPrevEvent} />
					</div>
					{eventsStore.selectedRootEvent
						?	<div className="header-main__title">
							{`${eventsStore.selectedRootEvent.eventName} — ${0.710}s — ${status}`}
						</div>
						: 	<div className="header-main__title">
							{/* eslint-disable-next-line max-len */}
							{`${new Date().toLocaleDateString()} — ${eventsStore.selectedRootEvent
								? (eventsStore.selectedRootEvent as EventAction).subNodes?.length
								: 0}`}
						</div>
					}

					<div className={navButtonClass}>
						<div
							className="header-button__icon right"
							onClick={eventsStore.selectNextEvent} />
					</div>
				</div>
				<div className="header__group">
					<ToggleButton
						isToggled={viewStore.selectedView === Views.EVENTS}
						onClick={() => viewStore.selectedView = Views.EVENTS}>
						Events
					</ToggleButton>
					<ToggleButton
						isToggled={viewStore.selectedView === Views.MESSAGES}
						onClick={() => viewStore.selectedView = Views.MESSAGES}>
						Messages
					</ToggleButton>
				</div>
			</div>
			{eventsStore.selectedRootEvent
			&& <div className="header__info">
				{eventsStore.selectedRootEvent.startTimestamp
				&& 	<div className="header__info-element">
					<span>Start:</span>
					<p>
						{formatTime(
							new Date(eventsStore.selectedRootEvent.startTimestamp.epochSecond * 1000).toString(),
						)}
					</p>
				</div>}
				{/* <div className="header__description">
					Description
				</div>
				<div className="header__info-element">
					<span>Finish:</span>
					<p style={{ opacity: 0 }}>
						{formatTime(new Date().toString())}
					</p>
				</div> */}
			</div>}
		</div>
	);
};

export default observer(Header);
