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
import { useWorkspaceEventsFilterStore } from '../../hooks';

type Props = {
	index: number;
	lastIndex: number;
	Render: () => React.ReactElement;
};

const TreeBranchRenderer = ({ index, lastIndex, Render }: Props) => {
	const filterStore = useWorkspaceEventsFilterStore();
	switch (index) {
		case 0:
			return (
				<>
					<button
						className='actions-list__nav up'
						onClick={() => filterStore.raiseFilterTimestamp(1800000)}
						title='Load newer events'
					/>
					<Render />
				</>
			);
		case lastIndex:
			return (
				<>
					<Render />
					<button
						className='actions-list__nav down'
						onClick={() => filterStore.lowerFilterTimestamp(1800000)}
						title='Load older events'
					/>
				</>
			);
		default:
			return <Render />;
	}
};

export default TreeBranchRenderer;
