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

import { action, observable } from 'mobx';
import { AppearanceTypes } from 'react-toast-notifications';

interface BaseNotificationError {
	type: AppearanceTypes;
	errorType: 'responseError' | 'urlError' | 'indexedDbError';
}
export interface ResponseError extends BaseNotificationError {
	errorType: 'responseError';
	resource: string;
	header: string;
	responseBody: string;
	responseCode: number | null;
}

export interface UrlError extends BaseNotificationError {
	errorType: 'urlError';
	link: string | null | undefined;
	error: Error;
}

export interface IndexedDbError extends BaseNotificationError {
	errorType: 'indexedDbError';
	header: string;
	description: string;
	action?: unknown;
}

export type NotificationError = ResponseError | UrlError | IndexedDbError;

export class NotificationsStore {
	@observable
	public errors: NotificationError[] = [];

	@action
	public addError = (error: NotificationError) => {
		this.errors = [...this.errors, error];
	};

	@action
	public deleteError = (error: NotificationError) => {
		this.errors = this.errors.filter(e => e !== error);
	};

	@action
	public handleSSEError = (event: Event) => {
		if (event instanceof MessageEvent) {
			const errorData = JSON.parse(event.data);
			notificationsStore.addError({
				type: 'error',
				header: errorData.exceptionName,
				resource: event.target instanceof EventSource ? event.target.url : event.origin,
				responseBody: errorData.exceptionCause,
				responseCode: null,
				errorType: 'responseError',
			});
		}
	};
}

const notificationsStore = new NotificationsStore();

export default notificationsStore;
