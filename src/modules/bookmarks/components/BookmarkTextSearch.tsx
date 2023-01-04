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

import { Input } from 'components/Input';
import { Button } from 'components/buttons/Button';

interface Props {
	value: string;
	setValue: (value: string) => void;
	label: string;
}

export default function BookmarkTextSearch({ value, setValue }: Props) {
	return (
		<div className='bookmark-panel-header__row'>
			<Input
				type='text'
				className='bookmarks-search'
				id='bookmark-text-search'
				value={value}
				onChange={e => setValue(e.target.value)}
			/>
			<Button className='input-submit' variant='contained'>
				Search
			</Button>
		</div>
	);
}
