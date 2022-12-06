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
import { createStyleSelector } from 'helpers/styleCreators';
import { EventStatus } from 'modules/events/models/Status';
import '../../styles/icons.scss';

interface StatusIconProps {
	status?: EventStatus | 'unknown';
}

export function StatusIcon(props: StatusIconProps) {
	const { status } = props;

	const className = createStyleSelector('status-icon', status ? status.toLowerCase() : null);

	return (
		<Icon className={className}>
			<svg
				width='16'
				height='16'
				viewBox='0 0 16 16'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'>
				<g>
					<path
						// eslint-disable-next-line max-len
						d='M12 12C9.79086 14.2091 6.20914 14.2091 4 12C1.79086 9.79086 1.79086 6.20914 4 4C6.20914 1.79086 9.79086 1.79086 12 4C14.2091 6.20914 14.2091 9.79086 12 12Z'
						fill='currentColor'
					/>
				</g>
				<defs>
					<clipPath id='clip0_476_12608'>
						<rect width='16' height='16' rx='8' fill='currentColor' />
					</clipPath>
				</defs>
			</svg>
		</Icon>
	);
}
