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

import * as React from 'react';
import { copyTextToClipboard } from '../../../../helpers/copyHandler';
import { showNotification } from '../../../../helpers/showNotification';
import { useSelectListener } from '../../../../hooks/useSelectListener';
import {
	decodeBase64RawContent,
	getRawContent,
	mapHumanReadableOffsetsToOctetOffsets,
	mapOctetOffsetsToHumanReadableOffsets,
} from '../../../../helpers/rawFormatter';
import '../../../../styles/messages.scss';
import { BodyFilter, uniteFilters, wrapString } from '../../../../helpers/filters';
import { MessageFilterState } from '../../../search-panel/SearchPanelFilters';
import { useSearchStore } from '../../../../hooks/useSearchStore';
import { useMessagesWorkspaceStore } from '../../../../hooks';
import { isRangesIntersect } from '../../../../helpers/range';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

interface Props {
	rawContent: string;
	applyFilterToBody?: boolean;
}

export default function DetailedMessageRaw({ rawContent, applyFilterToBody }: Props) {
	const { currentSearch } = useSearchStore();
	const { selectedBodyBinaryFilterRange } = useMessagesWorkspaceStore();

	const hexadecimalRef = React.useRef<HTMLPreElement>(null);
	const humanReadableRef = React.useRef<HTMLPreElement>(null);
	const [hexSelectionStart, hexSelectionEnd] = useSelectListener(hexadecimalRef);
	const [humanSelectionStart, humanSelectionEnd] = useSelectListener(humanReadableRef);

	const decodedRawContent = React.useMemo(() => decodeBase64RawContent(rawContent), [rawContent]);

	const [offset, hexadecimal, humanReadable, beautifiedHumanReadable] = getRawContent(
		decodedRawContent,
	);

	const humanContentOnCopy = (e: React.ClipboardEvent<HTMLPreElement>) => {
		if (humanSelectionStart != null && humanSelectionEnd != null) {
			const contentPart = humanReadable.substring(humanSelectionStart, humanSelectionEnd);
			e.preventDefault();
			copyTextToClipboard(contentPart);
		}
	};

	const filterEntriesHuman: Array<BodyFilter> = React.useMemo(() => {
		if (!applyFilterToBody) return [];

		const res: Array<BodyFilter> = [];

		(currentSearch?.request.filters as MessageFilterState).bodyBinary.values.forEach(value => {
			let lastIndex = -1;

			do {
				lastIndex = humanReadable.indexOf(value, lastIndex !== -1 ? lastIndex + value.length : 0);

				if (lastIndex !== -1) {
					const entryRange: [number, number] = [lastIndex, lastIndex + value.length - 1];
					res.push({
						type: new Set([
							entryRange[0] === selectedBodyBinaryFilterRange?.[0] &&
							entryRange[1] === selectedBodyBinaryFilterRange?.[1]
								? 'highlighted'
								: 'filtered',
						]),
						range: entryRange,
					});
				}
			} while (lastIndex !== -1);
		});
		return uniteFilters(res);
	}, [currentSearch?.request.filters]);

	const filterEntriesHex = React.useMemo(() => {
		return filterEntriesHuman.map(entry => ({
			type: new Set([...entry.type]),
			range: mapHumanReadableOffsetsToOctetOffsets(entry.range[0], entry.range[1]) as [
				number,
				number,
			],
		}));
	}, [filterEntriesHuman]);

	const renderHumanReadable = (content: string) => {
		if (hexSelectionStart === hexSelectionEnd) {
			if (!applyFilterToBody) return <span ref={humanReadableRef}>{content}</span>;

			const splitedContent = content.split('\n');

			let binaryPartPosition = 0;

			return (
				<span ref={humanReadableRef}>
					{splitedContent.flatMap((part, idx) => {
						const valueRange: [number, number] = [
							binaryPartPosition,
							binaryPartPosition + part.length - 1,
						];
						const includingFilters = filterEntriesHuman.filter(entry =>
							isRangesIntersect(entry.range, valueRange),
						);
						const value = includingFilters.length
							? wrapString(part, includingFilters, valueRange)
							: part;

						binaryPartPosition += part.length;

						return <React.Fragment key={idx}>{[value, '\n']}</React.Fragment>;
					})}
				</span>
			);
		}

		const [startOffset, endOffset] = mapOctetOffsetsToHumanReadableOffsets(
			hexSelectionStart as number,
			hexSelectionEnd as number,
		);

		return (
			<React.Fragment>
				{content.slice(0, startOffset)}
				<mark className='mc-raw__highlighted-content'>{content.slice(startOffset, endOffset)}</mark>
				{content.slice(endOffset)}
			</React.Fragment>
		);
	};

	const renderOctet = (content: string) => {
		if (humanSelectionStart === humanSelectionEnd) {
			if (!applyFilterToBody) return <span ref={hexadecimalRef}>{content}</span>;

			const splitedContent = content.split('\n');

			let binaryPartPosition = 0;

			return (
				<span ref={hexadecimalRef}>
					{splitedContent.flatMap((part, idx) => {
						const valueRange: [number, number] = [
							binaryPartPosition,
							binaryPartPosition + part.length - 1,
						];
						const includingFilters = filterEntriesHex.filter(entry =>
							isRangesIntersect(entry.range, valueRange),
						);
						const value = includingFilters.length
							? wrapString(part, includingFilters, valueRange)
							: part;

						binaryPartPosition += part.length;

						return <React.Fragment key={idx}>{[value, '\n']}</React.Fragment>;
					})}
				</span>
			);
		}

		const [startOffset, endOffset] = mapHumanReadableOffsetsToOctetOffsets(
			humanSelectionStart as number,
			humanSelectionEnd as number,
		);

		return (
			<span ref={hexadecimalRef}>
				{content.slice(0, startOffset)}
				<mark className='mc-raw__highlighted-content'>{content.slice(startOffset, endOffset)}</mark>
				{content.slice(endOffset)}
			</span>
		);
	};

	const copyHandler = (content: string) => {
		copyTextToClipboard(content);
		showNotification(COPY_NOTIFICATION_TEXT);
	};

	return (
		<div className='mc-raw__content'>
			<div className='mc-raw__column secondary'>
				<pre>{offset}</pre>
			</div>
			<div className='mc-raw__column primary'>
				<pre className='mc-raw__content-part'>{renderOctet(hexadecimal)}</pre>
				<div
					className='mc-raw__copy-btn mc-raw__copy-icon'
					onClick={() => copyHandler(hexadecimal)}
					title='Copy to clipboard'
				/>
			</div>
			<div className='mc-raw__column primary'>
				<pre className='mc-raw__content-part' onCopy={humanContentOnCopy}>
					{renderHumanReadable(beautifiedHumanReadable)}
				</pre>
				<div
					className='mc-raw__copy-btn mc-raw__copy-icon'
					onClick={() => copyHandler(humanReadable)}
					title='Copy to clipboard'
				/>
			</div>
		</div>
	);
}
