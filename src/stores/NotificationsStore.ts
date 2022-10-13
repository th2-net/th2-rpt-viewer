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
import { nanoid } from 'nanoid';
import { AppearanceTypes } from 'react-toast-notifications';

interface BaseNotification {
	type: AppearanceTypes;
	notificationType: 'responseError' | 'urlError' | 'genericError' | 'success';
	id: string;
}

export interface ResponseError extends BaseNotification {
	notificationType: 'responseError';
	resource: string;
	header: string;
	responseBody: string;
	responseCode: number | null;
}

export interface UrlError extends BaseNotification {
	notificationType: 'urlError';
	link: string | null | undefined;
	error: Error;
}

export interface GenericError extends BaseNotification {
	notificationType: 'genericError';
	header: string;
	description?: string;
	action?: {
		label: string;
		callback: () => void;
	};
}

export interface SuccessNotification extends BaseNotification {
	notificationType: 'success';
	description: string;
}

export type Notification = ResponseError | UrlError | GenericError | SuccessNotification;

export class NotificationsStore {
	@observable
	public errors: Notification[] = [];

	@action
	public addMessage = (error: Notification) => {
		this.errors = [...this.errors, error];
	};

	@action
	public deleteMessage = (error: Notification | string) => {
		if (typeof error === 'string') {
			this.errors = this.errors.filter(e => e.id !== error);
		} else {
			this.errors = this.errors.filter(e => e !== error);
		}
	};

	@action
	public handleSSEError = (event: Event) => {
		if (event instanceof MessageEvent) {
			const errorData = JSON.parse(event.data);
			this.addMessage({
				type: 'error',
				header: errorData.exceptionName,
				resource: event.target instanceof EventSource ? event.target.url : event.origin,
				responseBody: errorData.exceptionCause,
				responseCode: null,
				notificationType: 'responseError',
				id: nanoid(),
			});
		}
	};

	@action
	public handleRequestError = (response: Response) => {
		if (!response.ok) {
			const { url, status, statusText } = response;
			let header: string;
			switch (status) {
				case 404:
					header = "Storage doesn't contain the requested data.";
					break;
				case 503:
				case 502:
					header = 'rpt-data-provider is unavailable. Try again later.';
					break;
				default:
					header = statusText;
					break;
			}
			response.text().then(text => {
				this.addMessage({
					type: 'error',
					header,
					resource: url,
					responseCode: status,
					responseBody: text,
					notificationType: 'responseError',
					id: nanoid(),
				});
			});
		}
	};

	@action
	public clearAll = () => {
		this.errors = [];
	};
}

const notificationsStore = new NotificationsStore();

export default notificationsStore;
