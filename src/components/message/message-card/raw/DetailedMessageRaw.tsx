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
import { useSelectListener } from '../../../../hooks';
import {
	decodeBase64RawContent,
	getRawContent,
	mapHumanReadableOffsetsToOctetOffsets,
	mapOctetOffsetsToHumanReadableOffsets,
} from '../../../../helpers/rawFormatter';
import '../../../../styles/messages.scss';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

interface Props {
	rawContent: string;
}

export default function DetailedMessageRaw({ rawContent }: Props) {
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

	const renderHumanReadable = (content: string) => {
		if (hexSelectionStart === hexSelectionEnd) {
			return <span>{content}</span>;
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
			return <span>{content}</span>;
		}

		const [startOffset, endOffset] = mapHumanReadableOffsetsToOctetOffsets(
			humanSelectionStart as number,
			humanSelectionEnd as number,
		);

		return (
			<React.Fragment>
				{content.slice(0, startOffset)}
				<mark className='mc-raw__highlighted-content'>{content.slice(startOffset, endOffset)}</mark>
				{content.slice(endOffset)}
			</React.Fragment>
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
				<pre className='mc-raw__content-part' ref={hexadecimalRef}>
					{renderOctet(hexadecimal)}
				</pre>
				<div
					className='mc-raw__copy-btn   mc-raw__copy-icon'
					onClick={() => copyHandler(hexadecimal)}
					title='Copy to clipboard'
				/>
			</div>
			<div className='mc-raw__column primary'>
				<pre className='mc-raw__content-part' onCopy={humanContentOnCopy} ref={humanReadableRef}>
					{renderHumanReadable(beautifiedHumanReadable)}
				</pre>
				<div
					className='mc-raw__copy-btn   mc-raw__copy-icon'
					onClick={() => copyHandler(humanReadable)}
					title='Copy to clipboard'
				/>
			</div>
		</div>
	);
}
