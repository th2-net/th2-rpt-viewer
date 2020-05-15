/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import SearchResult from './SearchResult';


/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-new-wrappers */
function getScrolledIndex(
	searchResults: SearchResult, targetIndex: number,
): [Number| undefined, Number| undefined, Number| undefined] {
	const [currentKey = ''] = searchResults.getByIndex(targetIndex);
	const [keyType, keyId] = currentKey.split('-');
	const actionId = keyType === 'action' ? new Number(keyId) : undefined;
	const msgId = keyType === 'msg' ? new Number(keyId) : undefined;
	const logIndex = keyType === 'log' ? new Number(keyId) : undefined;

	return [actionId, msgId, logIndex];
}

export default getScrolledIndex;
