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

import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useToasts } from 'react-toast-notifications';
import { complement } from '../../helpers/array';
import {
	isGenericErrorMessage,
	isResponseError,
	isSuccessNotification,
	isURLError,
} from '../../helpers/notifications';
import { useNotificationsStore } from '../../hooks';
import { Notification } from '../../stores/NotificationsStore';
import FetchErrorToast from './FetchErrorToast';
import GenericErrorToast from './GenericErrorToast';
import SuccessNotificationToast from './SuccessNotification';
import UrlErrorToast from './UrlErrorToast';

function Notifier() {
	const { addToast, removeToast } = useToasts();

	// react-toast-notifications uses their own inner ids
	// in order to delete toast from outside of component we need to know inner id
	const idsMap = React.useRef<Record<string, string>>({});

	const notificiationStore = useNotificationsStore();

	const prevResponseErrors = React.useRef<Notification[]>([]);

	useEffect(() => {
		function onNotificationsUpdate(notifications: Notification[]) {
			const currentResponseErrors = !prevResponseErrors
				? notifications
				: complement(notifications, prevResponseErrors.current);

			const removedErrors =
				prevResponseErrors.current.filter(error => !notifications.includes(error)) || [];

			// We need this to be able to delete toast from outside of toast component
			removedErrors.forEach(error => removeToast(idsMap.current[error.id]));

			currentResponseErrors.forEach(notification => {
				const options = {
					appearance: notification.type,
					onDismiss: () => notificiationStore.deleteMessage(notification),
				};

				const registerId = (id: string) => (idsMap.current[notification.id] = id);

				if (isURLError(notification)) {
					addToast(<UrlErrorToast {...notification} />, options, registerId);
				} else if (isResponseError(notification)) {
					addToast(<FetchErrorToast {...notification} />, options, registerId);
				} else if (isGenericErrorMessage(notification)) {
					addToast(<GenericErrorToast {...notification} />, options, registerId);
				} else if (isSuccessNotification(notification)) {
					addToast(<SuccessNotificationToast {...notification} />, options, registerId);
				}
			});
			prevResponseErrors.current = notifications;
		}
		reaction(() => notificiationStore.errors, onNotificationsUpdate, { fireImmediately: true });
	}, []);

	return null;
}

export default observer(Notifier);
