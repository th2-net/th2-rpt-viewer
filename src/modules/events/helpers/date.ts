/** ****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

function timestampToNumber(timestamp: string): number {
	return new Date(timestamp).getTime();
}

export function getElapsedTime(
	startTimestamp: string,
	endTimestamp: string,
	withMiliseconds = true,
) {
	const diff = timestampToNumber(endTimestamp) - timestampToNumber(startTimestamp);
	const seconds = Math.floor(diff / 1000);
	const milliseconds = Math.floor(diff - seconds * 1000);

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds ? `${seconds}.${millisecondsFormatted}s` : `${seconds}s`;
}
