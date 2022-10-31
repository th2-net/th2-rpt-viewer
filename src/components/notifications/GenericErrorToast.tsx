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

import React from 'react';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { createStyleSelector } from '../../helpers/styleCreators';
import { GenericError } from '../../stores/NotificationsStore';

export default function GenericErrorToast(props: GenericError) {
	const { description, header, action } = props;
	const [copied, setCopied] = React.useState(false);
	const copyDetailsText = createStyleSelector('toast-action__text', copied ? 'copied' : null);

	const copy = () => {
		copyTextToClipboard(description);
		setCopied(true);
	};

	const shortenedDesc = description.length > 32 ? `${description.slice(0, 32)}...` : description;

	return (
		<div className='toast-content'>
			<div className='toast-content__top'>
				<p className='user-message'>{header}</p>
			</div>
			<div className='toast-content__description'>{shortenedDesc}</div>
			<div className='toast-content__bottom'>
				{action &&
					((action.label === 'Copy details' && (
						<div className='toast-content__bottom'>
							<button className='toast-action' disabled={copied} onClick={copy}>
								{!copied && <span className='toast-action__copy-icon' />}
								<span className={copyDetailsText}>{copied ? 'Copied' : ' Copy details'}</span>
							</button>
						</div>
					)) || (
						<div className='toast-content__bottom'>
							<button className='toast-action' onClick={action.callback}>
								<span className='toast-action__text'>{action.label}</span>
							</button>
						</div>
					))}
			</div>
		</div>
	);
}
