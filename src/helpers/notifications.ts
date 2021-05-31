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

import {
	Notification,
	UrlError,
	ResponseError,
	GenericError,
	SuccessNotification,
} from '../stores/NotificationsStore';

export function isURLError(error: Notification): error is UrlError {
	return error.notificationType === 'urlError';
}

export function isResponseError(error: Notification): error is ResponseError {
	return error.notificationType === 'responseError';
}

export function isGenericErrorMessage(error: Notification): error is GenericError {
	return error.notificationType === 'genericError';
}

export function isSuccessNotification(error: Notification): error is SuccessNotification {
	return error.notificationType === 'success';
}
