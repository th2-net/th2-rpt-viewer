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

import { Icon } from 'components/icons/Icon';
import '../../styles/icons.scss';

export function MessageIcon() {
	return (
		<Icon className='message-icon'>
			<svg
				width='17'
				height='17'
				viewBox='0 0 17 17'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'>
				<path
					// eslint-disable-next-line max-len
					d='M9.7648 14.7509C8.98375 15.5319 7.71742 15.5319 6.93637 14.7509L1.7648 9.57931C0.983751 8.79826 0.983752 7.53194 1.7648 6.75089L6.93638 1.57931C7.71743 0.798264 8.98375 0.798265 9.7648 1.57931L14.9364 6.75089C15.7174 7.53194 15.7174 8.79826 14.9364 9.57931L9.7648 14.7509Z'
					fill='currentColor'
				/>
			</svg>
		</Icon>
	);
}
