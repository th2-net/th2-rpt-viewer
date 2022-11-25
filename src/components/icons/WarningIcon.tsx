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

/* eslint-disable max-len */
import { Icon, IconProps } from './Icon';

export const WarningIcon = (props: IconProps) => (
	<Icon {...props}>
		<svg viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				d='M7.00004 13.6666C3.31804 13.6666 0.333374 10.682 0.333374 6.99998C0.333374 3.31798 3.31804 0.333313 7.00004 0.333313C10.682 0.333313 13.6667 3.31798 13.6667 6.99998C13.6667 10.682 10.682 13.6666 7.00004 13.6666ZM7.00004 12.3333C8.41453 12.3333 9.77108 11.7714 10.7713 10.7712C11.7715 9.77102 12.3334 8.41447 12.3334 6.99998C12.3334 5.58549 11.7715 4.22894 10.7713 3.22874C9.77108 2.22855 8.41453 1.66665 7.00004 1.66665C5.58555 1.66665 4.229 2.22855 3.2288 3.22874C2.22861 4.22894 1.66671 5.58549 1.66671 6.99998C1.66671 8.41447 2.22861 9.77102 3.2288 10.7712C4.229 11.7714 5.58555 12.3333 7.00004 12.3333ZM6.33337 8.99998H7.66671V10.3333H6.33337V8.99998ZM6.33337 3.66665H7.66671V7.66665H6.33337V3.66665Z'
				fill='currentColor'
			/>
		</svg>
	</Icon>
);
