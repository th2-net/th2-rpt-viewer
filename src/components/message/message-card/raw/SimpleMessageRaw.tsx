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
 * limitations under the License.
 ***************************************************************************** */

import { observer } from 'mobx-react-lite';
import * as React from 'react';
import { MessageFilterState } from 'modules/search/models/Search';
import { BodyFilter, getFiltersEntries, wrapString } from 'helpers/filters';
import { isRangesIntersect, trimRange } from 'helpers/range';
import { splitOnReadableParts } from 'helpers/stringUtils';
import { createBemElement } from 'helpers/styleCreators';
import { FilterEntry, SearchHistory } from 'modules/search/stores/SearchStore';

interface Props {
	rawContent: string;
	applyFilterToBody?: boolean;
	selectedBodyBinaryFilter?: FilterEntry;
	currentSearch?: SearchHistory | null;
}

function SimpleMessageRaw({
	rawContent,
	applyFilterToBody,
	currentSearch,
	selectedBodyBinaryFilter,
}: Props) {
	const contentRef = React.useRef<HTMLDivElement>(null);

	const humanReadableContent = atob(rawContent);
	const convertedArr = splitOnReadableParts(humanReadableContent);

	const filterEntries: Array<BodyFilter> = React.useMemo(() => {
		if (!applyFilterToBody || !(currentSearch?.request.filters as MessageFilterState).bodyBinary)
			return [];

		return getFiltersEntries(
			humanReadableContent,
			(currentSearch?.request.filters as MessageFilterState).bodyBinary.values,
			selectedBodyBinaryFilter || undefined,
		);
	}, [currentSearch?.request.filters]);

	let binaryPartPosition = 0;

	return (
		<div className='mc-raw__human' ref={contentRef}>
			{convertedArr.map((part, index) => {
				if (part.isPrintable) {
					const valueRange: [number, number] = [
						binaryPartPosition,
						binaryPartPosition + part.text.length - 1,
					];
					const trimedFilters = filterEntries
						.map(entry => ({
							type: entry.type,
							range: trimRange(entry.range, valueRange),
						}))
						.filter(entry => isRangesIntersect(entry.range, valueRange));
					const value =
						applyFilterToBody && trimedFilters.length
							? wrapString(part.text, trimedFilters, valueRange)
							: part.text;

					binaryPartPosition += part.text.length;

					return <span key={index}>{value}</span>;
				}

				const filteredEntries = filterEntries.filter(entry =>
					isRangesIntersect(entry.range, [binaryPartPosition, binaryPartPosition]),
				);
				binaryPartPosition += 1;

				const SOHCharacterClassName = createBemElement(
					'mc-raw',
					'non-printing-character',
					filteredEntries.length > 0 ? 'highlighted' : null,
				);

				return (
					<span key={index} className={SOHCharacterClassName}>
						SOH
					</span>
				);
			})}
		</div>
	);
}

export default observer(SimpleMessageRaw);
