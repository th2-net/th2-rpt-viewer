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

import clsx from 'clsx';
import { IconProps, Icon } from './Icon';
import '../../styles/icons.scss';

interface BookmarkIconProps extends IconProps {
	isPinned: boolean;
	className?: string;
}

/* eslint-disable max-len */
export function BookmarkIcon(props: BookmarkIconProps) {
	const { className = '', isPinned } = props;

	return (
		<Icon {...props} className={clsx('bookmark-icon', className, { pinned: isPinned })}>
			<svg
				width='12'
				height='15'
				viewBox='0 0 12 15'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'>
				<path
					d='M1.33329 0.333374H10.6666C10.8434 0.333374 11.013 0.403612 11.138 0.528636C11.2631 0.65366 11.3333 0.82323 11.3333 1.00004V13.762C11.3334 13.8216 11.3175 13.8802 11.2872 13.9315C11.257 13.9829 11.2135 14.0252 11.1614 14.0541C11.1092 14.083 11.0503 14.0973 10.9907 14.0957C10.9311 14.094 10.8731 14.0764 10.8226 14.0447L5.99996 11.02L1.17729 14.044C1.12687 14.0757 1.06888 14.0933 1.00936 14.095C0.949837 14.0967 0.89095 14.0824 0.838823 14.0536C0.786695 14.0248 0.743231 13.9826 0.712948 13.9313C0.682665 13.88 0.66667 13.8216 0.666626 13.762V1.00004C0.666626 0.82323 0.736864 0.65366 0.861888 0.528636C0.986912 0.403612 1.15648 0.333374 1.33329 0.333374Z'
					fill='currentColor'
				/>
			</svg>
		</Icon>
	);
}