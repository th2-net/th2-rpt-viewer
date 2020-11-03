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

import { observer } from 'mobx-react-lite';
import React, {	useEffect } from 'react';
import { useToasts } from 'react-toast-notifications';
import { complement } from '../helpers/array';
import { useNotificationsStore } from '../hooks/useNotificationsStore';
import { usePrevious } from '../hooks/usePrevious';
import FetchError from './FetchError';

function Notifier() {
	const { addToast } = useToasts();

	const { notifications, delNotification } = useNotificationsStore();

	const prevNotifications = usePrevious(notifications);

	useEffect(() => {
		const currentNotifications = !prevNotifications
			? notifications
			: complement(notifications, prevNotifications);
		currentNotifications.forEach(n => {
			const {
				url,
				type,
				status,
				statusText,
			} = n;
			addToast(
				<FetchError resource={url} responseBody={statusText} responseCode={status} />,
				{ appearance: type, onDismiss: () => { delNotification(n); } },
			);
		});
	}, [notifications]);


	return null;
}

export default observer(Notifier);
