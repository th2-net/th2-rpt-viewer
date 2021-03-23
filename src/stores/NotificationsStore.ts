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

import { action, observable, makeObservable } from 'mobx';
import { AppearanceTypes } from 'react-toast-notifications';

interface Notification {
	type: AppearanceTypes;
}
interface ResponseError extends Notification {
	resource: string;
	header: string;
	responseBody: string;
	responseCode: number | null;
}

interface UrlError extends Notification {
	link: string | null | undefined;
	error: Error;
}

export class NotificationsStore {
	public responseErrors: ResponseError[] = [];

	public urlError: UrlError | null = null;

	public addResponseError = (responseError: ResponseError): void => {
		this.responseErrors = [...this.responseErrors, responseError];
	};

	public delResponseError = (responseError: ResponseError): void => {
		this.responseErrors = this.responseErrors.filter(re => re !== responseError);
	};

	public setUrlError = (urlError: UrlError | null): void => {
		this.urlError = urlError;
	};

	constructor() {
		makeObservable(this, {
			responseErrors: observable,
			urlError: observable,
			addResponseError: action,
			delResponseError: action,
			setUrlError: action,
		});
	}
}

const notificationsStore = new NotificationsStore();

export default notificationsStore;
