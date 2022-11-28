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

import { Chip } from 'components/Chip';

interface Props {
	progress: number;
	searchCount: number;
}

export const SearchProgress = (props: Props) => (
	<div className='search-progress'>
		<div className='search-progress__labels'>
			<p className='search-progress__label'>{props.progress}% Completed</p>
			<Chip className='search-progress__count'>{props.searchCount}</Chip>
		</div>
		<div className='search-progress__loader'>
			<div className='search-progress__loader-filler' style={{ width: `${props.progress}%` }}></div>
		</div>
	</div>
);
