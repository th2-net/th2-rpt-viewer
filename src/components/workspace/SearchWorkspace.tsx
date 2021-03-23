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
import { useSearchWorkspace } from 'hooks';
import BookmarksPanel from '../BookmarksPanel';
import WorkspaceSplitter from './WorkspaceSplitter';
import SearchPanel from '../search-panel/SearchPanel';
import 'styles/workspace.scss';

const panelColors = {
	search: {
		default: '#ADC2EB',
		active: '#5C85D6',
	},
	bookmarks: {
		default: '#CCA3F5',
		active: '#A65CD6',
	},
} as const;

function SearchWorkspace() {
	const searchWorkspaceStore = useSearchWorkspace();
	const { panelsLayout, setPanelsLayout } = searchWorkspaceStore.viewStore;

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panelsLayout={panelsLayout}
				setPanelsLayout={setPanelsLayout}
				panels={[
					{
						title: 'Search',
						color: panelColors.search,
						component: <SearchPanel />,
						isActive: false,
					},
					{
						title: 'Bookmarks',
						color: panelColors.bookmarks,
						component: <BookmarksPanel />,
						isActive: false,
					},
				]}
			/>
		</div>
	);
}

export default observer(SearchWorkspace);
