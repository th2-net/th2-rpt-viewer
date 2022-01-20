/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import { useState, useCallback } from 'react';
import { until } from '../helpers/timeout';

export const useScreenshot = () => {
	const [image, setImage] = useState<string>();

	const takeScreenshot = async () => {
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
			setImage(frame);
		} catch (e) {
			console.error(e);
		} finally {
			stream.getTracks().forEach((track: MediaStreamTrack) => {
				track.stop();
			});
		}
	};

	const clear = useCallback(() => setImage(undefined), []);

	return { image, takeScreenshot, clear };
};

export default useScreenshot;
