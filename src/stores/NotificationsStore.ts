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

class NotificationsStore {
	@observable responseErrors: ResponseError[] = [];

	@action
	addResponseError = (responseError: ResponseError) => {
		this.responseErrors = [...this.responseErrors, responseError];
	};

	@action
	delResponseError = (responseError: ResponseError) => {
		this.responseErrors = this.responseErrors.filter(re => re !== responseError);
	};

	@observable urlError: UrlError | null = null;

	@action
	setUrlError = (urlError: UrlError | null) => {
		this.urlError = urlError;
	};
}

const notificationsStore = new NotificationsStore();

export default notificationsStore;
