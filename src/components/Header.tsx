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
import { getSecondsPeriod, formatTime } from '../helpers/date';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import SearchInput from './search/SearchInput';
import { MlUploadIndicator } from './machinelearning/MlUploadIndicator';
import LiveTimer from './LiveTimer';
import FilterPanel from './filter/FilterPanel';
import useOutsideClickListener from '../hooks/useOutsideClickListener';
import { downloadTxtFile } from '../helpers/files/downloadTxt';
import Dropdown from './Dropdown';
import { getMessagesContent } from '../helpers/rawFormatter';
import '../styles/header.scss';

export const Header = observer(() => {
	const { selectedStore, reportStore, filterStore } = useStores();
	const testCase = selectedStore.testCase!;
	const {
		name = 'Test Case',
		startTime,
		finishTime,
		id,
		hash,
		description,
	} = testCase;

	const [showFilter, setShowFilter] = React.useState(false);
	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(filterBaseRef, (e: MouseEvent) => {
		if (!filterButtonRef.current?.contains(e.target as Element)) {
			setShowFilter(false);
		}
	});

	const status = testCase.status.status || 'RUNNING';
	const period = getSecondsPeriod(startTime, finishTime!);

	const rootClass = createStyleSelector(
		'header',
		status,
	);
	const navButtonClass = createStyleSelector(
		'header-button',
		reportStore.report?.metadata!.length > 1 ? '' : 'disabled',
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
		const fileName = `${testCase.name}_messages_${new Date().toISOString()}.txt`;
		downloadTxtFile([content], fileName);
	};

	return (
		<div className={rootClass}>
			<div className="header__main   header-main">
				<div className="header__group">
					<div className="header-button">
						<div className="header-button__icon go-back"/>
						<div className="header-button__title">Back to list</div>
					</div>
					<Dropdown
						disabled={selectedStore.messages.length === 0}
						className="header__dropdown">
						<Dropdown.Trigger>
							<div className="header-button__icon export" />
							<div>Export Messages</div>
							<div className="header-button__icon down" />
						</Dropdown.Trigger>
						<Dropdown.Menu>
							<Dropdown.MenuItem
								onClick={() => downloadMessages(['contentHumanReadable'])}>
                                Human-Readable
							</Dropdown.MenuItem>
							<Dropdown.MenuItem
								onClick={() => downloadMessages(['hexadecimal'])}>
                                Hexadecimal
							</Dropdown.MenuItem>
							<Dropdown.MenuItem
								onClick={() => downloadMessages(['raw'])}>
                                Raw
							</Dropdown.MenuItem>
							<Dropdown.MenuItem
								onClick={() => downloadMessages(['contentHumanReadable', 'hexadecimal'])}>
                                All
							</Dropdown.MenuItem>
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="header-main__name header__group">
					<div className={navButtonClass}>
						<div className="header-button__icon left"/>
					</div>
					<div className="header-main__title">
						{
							reportStore.report?.finishTime !== null ? (
								<React.Fragment>
									<div className="header-main__spinner"/>
									{name} — {status} — <LiveTimer startTime={startTime}/>
								</React.Fragment>
							) : (
								`${name} — ${status} — ${period}`
							)
						}
					</div>
					<div className={navButtonClass}>
						<div className="header-button__icon right"/>
					</div>
				</div>
				<div className="header__group">
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
					<div className="header-main__search">
						<SearchInput/>
					</div>
				</div>
			</div>
			<div className="header__info">
				<div className="header__group">
					<div className="header__info-element">
						<span>Start:</span>
						<p>{formatTime(startTime)}</p>
					</div>
					{
						reportStore.report?.finishTime !== null ? null : (
							<div className="header__info-element">
								<span>Finish:</span>
								<p>{finishTime && formatTime(finishTime)}</p>
							</div>
						)
					}
				</div>
				<div className="header__description header__group">
					{description}
				</div>
				<div className="header__group">
					<div className="header__info-element">
						<span>ID:</span>
						<p>{id}</p>
					</div>
					<div className="header__info-element">
						<span>Hash:</span>
						<p>{hash}</p>
					</div>
					<div className="header__info-element">
						<MlUploadIndicator/>
					</div>
				</div>
			</div>
		</div>
	);
});
