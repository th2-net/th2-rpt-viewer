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

import moment from 'moment';
import { ChunkData } from '../models/graph';

export const generateGraphValues = (from: number, to: number): ChunkData[] => {
	const data = [];
	const ticksInterval = (to - from) / 15 / 1000 / 60;

	for (let i = 0; i < 16; i++) {
		data[i] = {
			timestamp: moment(from)
				.startOf('minute')
				.add(ticksInterval * i, 'minutes')
				.valueOf(),
			passed: Math.round(Math.random() * 100),
			failed: Math.round(Math.random() * 100),
			messages: Math.round(Math.random() * 400),
		} as ChunkData;
	}
	return data;
};
