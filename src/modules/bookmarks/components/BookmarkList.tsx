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

import { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Virtuoso } from 'react-virtuoso';
import Empty from 'components/util/Empty';
import { Bookmark } from '../models/Bookmarks';

interface BookmarkListProps {
	bookmarks: Bookmark[];
	renderBookmark: (index: number, bookmark: Bookmark) => ReactNode;
	isEmpty?: boolean;
}

function BookmarkListBase(props: BookmarkListProps) {
	const { bookmarks, renderBookmark, isEmpty } = props;

	return (
		<div className='bookmarks-panel__container'>
			{isEmpty && <Empty description='No bookmarks added' />}
			<Virtuoso
				className='bookmarks-panel__list'
				data={bookmarks}
				itemContent={renderBookmark}
				style={{ height: '100%' }}
			/>
		</div>
	);
}

export const BookmarkList = observer(BookmarkListBase);
