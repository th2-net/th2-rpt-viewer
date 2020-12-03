/** *****************************************************************************
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useWorkspaceEventStore } from '../../hooks';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { createBemBlock } from '../../helpers/styleCreators';
import '../../styles/search.scss';

type Props = {
	content: string;
	eventId: string;
};

function SearchableContent({ content, eventId }: Props) {
	const { searchStore } = useWorkspaceEventStore();

	if (!searchStore.results.includes(eventId)) {
		return <>{content}</>;
	}

	const splitContent = multiTokenSplit(content, searchStore.tokens);

	const contentPartClass = createBemBlock(
		'found-content',
		searchStore.scrolledItem === eventId ? 'target' : null,
	);

	return (
		<>
			{splitContent.map((contentPart, index) => (
				<span
					key={index}
					className={contentPart.token != null ? contentPartClass : undefined}
					style={{ backgroundColor: contentPart.token?.color }}>
					{contentPart.content}
				</span>
			))}
		</>
	);
}

export default observer(SearchableContent);
