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
import { EventMessage } from '../models/EventMessage';
import { Chunk } from '../models/graph';
import { getTimestampAsNumber } from './date';

export function filterListByChunkRange(chunk: Chunk, list: EventMessage[]) {
	return list.filter(item =>
		moment(getTimestampAsNumber(item.timestamp)).isBetween(moment(chunk.from), moment(chunk.to)),
	);
}
