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

import { action, computed, observable, reaction } from 'mobx';
import api from '../api';
import { UserApiSchema } from '../api/ApiSchema';
import { until } from '../helpers/timeout';
import { UserFeedback } from '../models/User';
import userDataStoreInstance, { UserDataStore } from './UserDataStore';

export enum FeedbackFields {
	TITLE = 'title',
	DESCR = 'descr',
	IMAGE = 'image',
}

export class FeedbackStore {
	constructor(private userApi: UserApiSchema, private userDataStore: UserDataStore) {
		window.addEventListener('error', e => {
			this.addError(e);
		});
		reaction(() => this.isOpen, this.clearScreenshot);
	}

	@observable
	public isOpen = false;

	@observable
	public isLoading = false;

	@observable
	public inputs = {
		[FeedbackFields.TITLE]: '',
		[FeedbackFields.DESCR]: '',
		[FeedbackFields.IMAGE]: '',
	};

	@observable
	public errors: ErrorEvent[] = [];

	@observable
	private responses: Response[] = [];

	@computed private get user(): string {
		return this.userDataStore.userId;
	}

	@computed private get feedback(): UserFeedback {
		return {
			user: this.user,
			...this.inputs,
			errors: this.errors,
			responses: this.responses,
		};
	}

	@action
	public toggleOpen = (o?: boolean) => {
		this.isOpen = o === undefined ? !this.isOpen : o;
	};

	@action
	public setInputValues = (key: FeedbackFields, value: string) => {
		this.inputs = { ...this.inputs, [key]: value };
	};

	@action
	public addResponse = (res: Response) => {
		if (this.responses.length === 10) {
			this.responses.shift();
		}
		this.responses.push(res);
	};

	@action
	public takeScreenshot = async () => {
		const stream = await navigator.mediaDevices
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			.getDisplayMedia({
				audio: false,
			});

		const video = document.createElement('video');
		video.autoplay = true;
		const canvas = document.createElement('canvas');
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		const context = canvas.getContext('2d');

		try {
			video.srcObject = stream;
			// without this delay canvas rendering context can't draw frame from captured screen video
			await until(40);
			context?.drawImage(video, 0, 0, window.innerWidth, window.innerHeight);
			const frame = canvas.toDataURL('image/jpeg');
			this.setInputValues(FeedbackFields.IMAGE, frame);
		} catch (e) {
			console.error(e);
		} finally {
			stream.getTracks().forEach((track: MediaStreamTrack) => {
				track.stop();
			});
		}
	};

	@action
	public clearScreenshot = (isOpen?: boolean) => {
		if (!isOpen) {
			this.setInputValues(FeedbackFields.IMAGE, '');
		}
	};

	@action
	public sendFeedback = () => {
		this.setIsLoading(true);
		this.userApi.sendUserFeedback(this.feedback).finally(() => {
			this.setIsLoading(false);
		});
	};

	@action
	private setIsLoading = (loading: boolean) => {
		this.isLoading = loading;
	};

	@action
	private addError = (error: ErrorEvent) => {
		if (error.message === 'ResizeObserver loop limit exceeded') {
			return;
		}
		if (this.errors.length === 10) {
			this.errors.shift();
		}
		this.errors.push(error);
	};
}

const feedbackStore = new FeedbackStore(api.userApi, userDataStoreInstance);

export default feedbackStore;
