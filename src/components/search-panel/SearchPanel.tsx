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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { useActivePanel, useActiveWorkspace } from '../../hooks';
import TogglerRow from '../filter/row/TogglerRow';
import SearchPanelFilters from './SearchPanelFilters';
import SearchPanelForm from './SearchPanelForm';
import { useSearchStore } from '../../hooks/useSearchStore';
import SearchPanelResults from './SearchPanelResults';
import SearchPanelProgressBar from './SearchPanelProgressBar';
import { FilterRowTogglerConfig } from '../../models/filter/FilterInputs';
import '../../styles/search-panel.scss';

export type SearchPanelType = 'event' | 'message';

const SearchPanel = () => {
	const activeWorkspace = useActiveWorkspace();
	const { ref: searchPanelRef } = useActivePanel(null);
	const searchStore = useSearchStore();

	const formTypeTogglerConfig: FilterRowTogglerConfig = React.useMemo(
		() => ({
			type: 'toggler',
			value: searchStore.formType === 'event',
			disabled: searchStore.isFormDisabled,
			toggleValue: searchStore.toggleFormType,
			possibleValues: ['event', 'message'],
			id: 'source-type',
			label: '',
		}),
		[searchStore.formType, searchStore.isFormDisabled, searchStore.toggleFormType],
	);

	return (
		<div className='search-panel-wrapper'>
			<div className='search-panel' ref={searchPanelRef}>
				<div className='search-panel__toggle'>
					<TogglerRow config={formTypeTogglerConfig} />
				</div>
				<div className='search-panel__form'>
					<div className='search-panel__fields'>
						<SearchPanelForm
							disabled={searchStore.isFormDisabled}
							form={searchStore.searchForm}
							formType={searchStore.formType}
							updateForm={searchStore.updateForm}
							streams={searchStore.formType === 'message' ? searchStore.messageSessions : null}
						/>
					</div>
					<div className='filters'>
						{searchStore.filters && searchStore.filters.info.length > 0 && (
							<SearchPanelFilters {...searchStore.filters} />
						)}
					</div>
					<div className='search-panel__buttons'>
						<button
							disabled={searchStore.isFormDisabled}
							className='search-panel__submit'
							onClick={
								searchStore.searchChannel ? searchStore.stopSearch : searchStore.startSearch
							}>
							{searchStore.searchChannel ? 'stop' : 'start'}
						</button>
					</div>
				</div>
			</div>
			<SearchPanelProgressBar searchProgress={searchStore.searchProgress} />
			{searchStore.currentSearch && (
				<SearchPanelResults
					resultGroups={searchStore.resultGroups}
					timestamp={searchStore.currentSearch.timestamp}
					onResultItemClick={activeWorkspace.onSearchResultItemSelect}
					onResultDelete={() => {
						if (searchStore.currentSearch) {
							searchStore.deleteHistoryItem(searchStore.currentSearch);
						}
					}}
					showToggler={searchStore.searchHistory.length > 1}
					next={searchStore.nextSearch}
					prev={searchStore.prevSearch}
					disableNext={searchStore.currentIndex === searchStore.searchHistory.length - 1}
					disablePrev={searchStore.currentIndex === 0}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);
