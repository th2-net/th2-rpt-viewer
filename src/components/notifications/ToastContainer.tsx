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
import { ToastContainerProps } from 'react-toast-notifications';
import { createBemElement } from '../../helpers/styleCreators';
import notificationsStore from '../../stores/NotificationsStore';
import '../../styles/toasts.scss';

function ToastContainer(props: ToastContainerProps) {
	const { hasToasts, children } = props;

	const closeAllButtonClassname = createBemElement('toast-container', 'close-all');

	if (!hasToasts) return null;

	return (
		<div className='toast-container'>
			<div
				className={closeAllButtonClassname}
				title='Close all'
				onClick={() => notificationsStore.clearAll()}
			/>
			<div className='toast-container__list'>{children}</div>
		</div>
	);
}

export default ToastContainer;
