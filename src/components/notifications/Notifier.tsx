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
import { isGenericErrorMessage, isResponseError, isURLError } from '../../helpers/errors';
import { useNotificationsStore, usePrevious } from '../../hooks';
import { NotificationError } from '../../stores/NotificationsStore';
import FetchErrorToast from './FetchErrorToast';
import GenericErrorToast from './GenericErrorToast';
import UrlErrorToast from './UrlErrorToast';

function Notifier() {
	const { addToast, removeToast } = useToasts();

	// react-toast-notifications uses their own inner ids
	// in order to delete toast from outside of component we need to know inner id
	const idsMap = React.useRef<Record<string, string>>({});

	const notificiationStore = useNotificationsStore();

	const prevResponseErrors = usePrevious(notificiationStore.errors);

	useEffect(() => {
		function onNotificationsUpdate(notifications: NotificationError[]) {
			const currentResponseErrors = !prevResponseErrors
				? notifications
				: complement(notifications, prevResponseErrors);

			const removedErrors =
				prevResponseErrors?.filter(error => !notifications.includes(error)) || [];

			// We need this to be able to delete toast from outside of toast component
			removedErrors.forEach(error => removeToast(idsMap.current[error.id]));

			currentResponseErrors.forEach(notificationError => {
				const options = {
					appearance: notificationError.type,
					onDismiss: () => notificiationStore.deleteMessage(notificationError),
				};

				const registerId = (id: string) => (idsMap.current[notificationError.id] = id);

				if (isURLError(notificationError)) {
					addToast(<UrlErrorToast {...notificationError} />, options, registerId);
				} else if (isResponseError(notificationError)) {
					addToast(<FetchErrorToast {...notificationError} />, options, registerId);
				} else if (isGenericErrorMessage(notificationError)) {
					addToast(<GenericErrorToast {...notificationError} />, options, registerId);
				}
			});
		}
		reaction(() => notificiationStore.errors, onNotificationsUpdate, { fireImmediately: true });
	}, []);

	return null;
}

export default observer(Notifier);
