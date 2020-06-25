/** *****************************************************************************
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

import * as React from 'react';
import { decodeBase64RawContent } from '../../helpers/rawFormatter';
import { replaceNonPrintableCharsWithDot } from '../../helpers/stringUtils';
import useSelectListener from '../../hooks/useSelectListener';
import { copyTextToClipboard } from '../../helpers/copyHandler';

interface Props {
	rawContent: string;
}

export default function SimpleMessageRaw({ rawContent }: Props) {
	const contentRef = React.useRef<HTMLDivElement>(null);
	const [selectionStart, selectionEnd] = useSelectListener(contentRef);

	const [, , humanReadableArray] = decodeBase64RawContent(rawContent);
	const humanReadableContent = humanReadableArray.join();
	const beautifiedHumanReadable = replaceNonPrintableCharsWithDot(humanReadableContent);

	const onCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
		if (selectionStart != null && selectionEnd != null) {
			const copyPart = humanReadableContent.substring(selectionStart, selectionEnd);
			e.preventDefault();
			copyTextToClipboard(copyPart);
		}
	};

	return (
		<div className="mc-raw">
			<div className="mc-raw__header">
				<div className="mc-raw__title">Raw message</div>
			</div>
			<div className="mc-raw__content" ref={contentRef} onCopy={onCopy}>
				{beautifiedHumanReadable}
			</div>
		</div>
	);
}
