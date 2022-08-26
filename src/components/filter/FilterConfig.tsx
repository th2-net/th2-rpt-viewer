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
import MessagesFilter from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { EntityType } from 'models/EventAction';
import FiltersHistory from 'components/filters-history/FiltersHistory';
import { ViewMode } from 'components/ViewModeProvider';
import useViewMode from 'hooks/useViewMode';
import { createStyleSelector } from '../../helpers/styleCreators';
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import { FilterRows } from './FilterRows';
import '../../styles/filter.scss';

interface Props<T extends MessagesFilter | EventsFilter> {
	config: FilterRowConfig[];
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
	onSubmit: () => void;
	onClearAll: () => void;
	isEmbedded?: boolean;
	filter?: T | null;
	setFilter?: (filter: Partial<T>) => void;
	type?: EntityType;
}

const FilterConfig = <T extends MessagesFilter | EventsFilter>(props: Props<T>) => {
	const {
		showFilter,
		setShowFilter,
		config,
		onSubmit,
		onClearAll,
		filter,
		setFilter,
		type = 'event',
		isEmbedded,
	} = props;

	const viewMode = useViewMode();

	function onSubmitClick() {
		onSubmit();
		setShowFilter(false);
	}

	function onClose() {
		setShowFilter(false);
	}

	function onClearAllClick() {
		onClearAll();
	}

	const filterWrapperClass = createStyleSelector(
		'filter-wrapper',
		isEmbedded ? 'embedded' : null,
		showFilter ? 'active' : null,
	);

	return (
		<div className={filterWrapperClass}>
			<div className='filter'>
				<div className='filter-inputs'>
					<FilterRows config={config} />
				</div>
				<div className='filter-controls'>
					{viewMode !== ViewMode.EmbeddedMessages && filter && setFilter && (
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
					<div className='filter-row__button close' onClick={onClose}>
						Close
					</div>
					<div className='filter-row__button submit' onClick={onSubmitClick}>
						Filter
					</div>
				</div>
			</div>
		</div>
	);
};

export default React.memo(FilterConfig);
