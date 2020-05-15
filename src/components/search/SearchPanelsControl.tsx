/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useFirstEventWindowStore } from '../../hooks/useFirstEventWindowStore';
import Checkbox from '../util/Checkbox';

const SearchPanelControl = observer(() => {
	const { viewStore, searchStore } = useFirstEventWindowStore();

	const onLeftPanelSelect = () => {
		if (!viewStore.isLeftPanelClosed) {
			searchStore.leftPanelEnabled = !searchStore.leftPanelEnabled;
		}
	};

	const onRightPanelSelect = () => {
		if (!viewStore.isRightPanelClosed) {
			searchStore.rightPanelEnabled = !searchStore.rightPanelEnabled;
		}
	};

	return (
		<div className="search-panel-controls">
			<Checkbox
				className='search-panel-controls__checkbox'
				id='left-panel'
				checked={searchStore.leftPanelEnabled}
				label={viewStore.leftPanel.toLowerCase().replace('_', ' ')}
				onChange={onLeftPanelSelect}
				isDisabled={viewStore.isLeftPanelClosed}/>
			<Checkbox
				className='search-panel-controls__checkbox'
				id='right-panel'
				checked={searchStore.rightPanelEnabled}
				label={viewStore.rightPanel.toLowerCase().replace('_', ' ')}
				onChange={onRightPanelSelect}
				isDisabled={viewStore.isRightPanelClosed}/>
		</div>
	);
});

export default SearchPanelControl;
