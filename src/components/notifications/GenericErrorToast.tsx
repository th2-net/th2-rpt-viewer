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

import React from 'react';
import { GenericError } from '../../stores/NotificationsStore';

export default function GenericErrorToast(props: GenericError) {
	const { description, header, action } = props;

	return (
		<div className='toast-content'>
			<div className='toast-content__top'>
				<p className='user-message'>{header}</p>
			</div>
			<div className='toast-content__description'>{description}</div>
			{action && (
				<div className='toast-content__bottom'>
					<button className='toast-action' onClick={action.callback}>
						<span className='toast-action__text'>{action.label}</span>
					</button>
				</div>
			)}
		</div>
	);
}
