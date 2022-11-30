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

export const SearchIcon = (props: IconProps) => (
	<Icon {...props}>
		<svg width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				d='M7.33325 1.49814C10.6453 1.49814 13.3333 4.18614 13.3333 7.49814C13.3333 10.8101 10.6453 13.4981 7.33325 13.4981C4.02125 13.4981 1.33325 10.8101 1.33325 7.49814C1.33325 4.18614 4.02125 1.49814 7.33325 1.49814ZM7.33325 12.1648C9.91125 12.1648 11.9999 10.0761 11.9999 7.49814C11.9999 4.91947 9.91125 2.83147 7.33325 2.83147C4.75459 2.83147 2.66659 4.91947 2.66659 7.49814C2.66659 10.0761 4.75459 12.1648 7.33325 12.1648ZM12.9899 12.2121L14.8759 14.0975L13.9326 15.0408L12.0473 13.1548L12.9899 12.2121Z'
				fill='currentColor'
			/>
		</svg>
	</Icon>
);
